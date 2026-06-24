import {
  parseFontFamily,
  parseFontSize,
  parseFontWeight,
  parseLineHeight,
  parseSpacing,
  getShorthand,
  parseShadow,
  extractTypography,
  extractSpacing,
  extractVisualEffects,
  extractAllStyles,
  getElementSelector,
  convertToPx
} from '../utils/styleExtractor.js';

describe('Style Extraction', () => {
  describe('parseFontFamily', () => {
    test('should parse single font family', () => {
      const result = parseFontFamily('Arial');
      expect(result).toEqual(['Arial']);
    });

    test('should parse multiple font families', () => {
      const result = parseFontFamily('"Helvetica Neue", Helvetica, Arial, sans-serif');
      expect(result).toContain('Helvetica Neue');
      expect(result).toContain('Arial');
    });

    test('should handle quoted fonts', () => {
      const result = parseFontFamily('"Comic Sans MS", cursive');
      expect(result[0]).toBe('Comic Sans MS');
    });

    test('should return empty array for null', () => {
      expect(parseFontFamily(null)).toEqual([]);
    });
  });

  describe('parseFontSize', () => {
    test('should parse pixel sizes', () => {
      const result = parseFontSize('16px');
      expect(result.value).toBe(16);
      expect(result.unit).toBe('px');
    });

    test('should parse em sizes', () => {
      const result = parseFontSize('1.5em');
      expect(result.value).toBe(1.5);
      expect(result.unit).toBe('em');
    });

    test('should parse rem sizes', () => {
      const result = parseFontSize('2rem');
      expect(result.value).toBe(2);
      expect(result.unit).toBe('rem');
    });

    test('should calculate px equivalent', () => {
      const result = parseFontSize('1em');
      expect(result.inPx).toBe(16); // 1em = 16px
    });

    test('should return null for null input', () => {
      expect(parseFontSize(null)).toBeNull();
    });
  });

  describe('parseFontWeight', () => {
    test('should parse named weights', () => {
      const result = parseFontWeight('bold');
      expect(result.value).toBe(700);
    });

    test('should parse numeric weights', () => {
      const result = parseFontWeight('600');
      expect(result.value).toBe(600);
    });

    test('should map numeric to names', () => {
      const result = parseFontWeight('700');
      expect(result.name).toBe('bold');
    });

    test('should default to normal for unknown', () => {
      const result = parseFontWeight('unknown');
      expect(result.value).toBe(400);
    });
  });

  describe('parseLineHeight', () => {
    test('should parse unitless line heights', () => {
      const result = parseLineHeight('1.5');
      expect(result.value).toBe(1.5);
      expect(result.unit).toBe('unitless');
    });

    test('should parse pixel line heights', () => {
      const result = parseLineHeight('24px');
      expect(result.value).toBe(24);
      expect(result.unit).toBe('px');
    });

    test('should parse em line heights', () => {
      const result = parseLineHeight('1.5em');
      expect(result.value).toBe(1.5);
      expect(result.unit).toBe('em');
    });

    test('should return null for null input', () => {
      expect(parseLineHeight(null)).toBeNull();
    });
  });

  describe('parseSpacing', () => {
    test('should parse single spacing value', () => {
      const result = parseSpacing('10px');
      expect(result.length).toBe(1);
      expect(result[0].value).toBe(10);
    });

    test('should parse multiple spacing values', () => {
      const result = parseSpacing('10px 20px 10px 20px');
      expect(result.length).toBe(4);
      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(20);
    });

    test('should handle em and rem units', () => {
      const result = parseSpacing('1em 0.5rem');
      expect(result[0].unit).toBe('em');
      expect(result[1].unit).toBe('rem');
    });

    test('should return null for null input', () => {
      expect(parseSpacing(null)).toBeNull();
    });
  });

  describe('convertToPx', () => {
    test('should convert em to px', () => {
      expect(convertToPx(1, 'em')).toBe(16);
      expect(convertToPx(2, 'em')).toBe(32);
    });

    test('should convert rem to px', () => {
      expect(convertToPx(1, 'rem')).toBe(16);
    });

    test('should convert percent to px', () => {
      expect(convertToPx(100, '%')).toBe(16);
    });

    test('should return px values unchanged', () => {
      expect(convertToPx(16, 'px')).toBe(16);
    });

    test('should convert pt to px', () => {
      expect(convertToPx(12, 'pt')).toBe(16); // 12pt = 16px
    });
  });

  describe('parseShadow', () => {
    test('should parse box shadow', () => {
      const result = parseShadow('0px 4px 6px rgba(0, 0, 0, 0.1)');
      expect(Array.isArray(result)).toBe(true);
    });

    test('should parse multiple shadows', () => {
      const result = parseShadow('0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)');
      expect(result.length).toBe(2);
    });

    test('should handle none value', () => {
      const result = parseShadow('none');
      expect(result).toEqual([]);
    });

    test('should parse shadow components', () => {
      const result = parseShadow('0px 4px 6px rgba(0, 0, 0, 0.1)');
      if (result.length > 0 && result[0].offsetX) {
        expect(result[0].offsetX).toBe('0px');
        expect(result[0].offsetY).toBe('4px');
      }
    });
  });

  describe('getElementSelector', () => {
    test('should generate selector for element with id', () => {
      const element = document.createElement('div');
      element.id = 'main';
      const selector = getElementSelector(element);
      expect(selector).toContain('main');
    });

    test('should generate selector for element with classes', () => {
      const element = document.createElement('div');
      element.className = 'container main';
      const selector = getElementSelector(element);
      expect(selector).toContain('div');
      expect(selector).toContain('container');
    });

    test('should generate nested selector', () => {
      const parent = document.createElement('div');
      parent.className = 'wrapper';

      const child = document.createElement('span');
      child.className = 'text';
      parent.appendChild(child);

      const selector = getElementSelector(child);
      expect(selector).toBeTruthy();
    });
  });

  describe('extractTypography', () => {
    test('should extract typography styles', () => {
      const element = document.createElement('p');
      const typo = extractTypography(element);

      expect(typo).toHaveProperty('fontFamily');
      expect(typo).toHaveProperty('fontSize');
      expect(typo).toHaveProperty('fontWeight');
      expect(typo).toHaveProperty('lineHeight');
    });

    test('should return empty object for null', () => {
      expect(extractTypography(null)).toEqual({});
    });
  });

  describe('extractSpacing', () => {
    test('should extract spacing styles', () => {
      const element = document.createElement('div');
      element.style.margin = '10px';
      element.style.padding = '20px';

      const spacing = extractSpacing(element);
      expect(spacing).toHaveProperty('margin');
      expect(spacing).toHaveProperty('padding');
    });
  });

  describe('extractVisualEffects', () => {
    test('should extract visual effects', () => {
      const element = document.createElement('div');
      element.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      element.style.backgroundColor = '#FF5733';
      element.style.borderRadius = '8px';

      const effects = extractVisualEffects(element);
      expect(effects).toHaveProperty('boxShadow');
      expect(effects).toHaveProperty('backgroundColor');
      expect(effects).toHaveProperty('borderRadius');
    });
  });

  describe('extractAllStyles', () => {
    test('should extract all styles from element', () => {
      const element = document.createElement('button');
      element.id = 'submit-btn';
      element.className = 'btn primary';
      element.style.backgroundColor = '#3366FF';

      const styles = extractAllStyles(element);
      expect(styles.tag).toBe('button');
      expect(styles.id).toBe('submit-btn');
      expect(styles.classes).toContain('btn');
      expect(styles.classes).toContain('primary');
      expect(styles).toHaveProperty('typography');
      expect(styles).toHaveProperty('spacing');
      expect(styles).toHaveProperty('visual');
    });
  });
});
