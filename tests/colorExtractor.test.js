import {
  parseColor,
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  isValidColor,
  extractColorsFromElement,
  getVisibleBackgroundColor
} from '../utils/colorExtractor.js';

describe('Color Extraction', () => {
  describe('parseColor', () => {
    test('should parse hex colors', () => {
      const result = parseColor('#FF5733');
      expect(result.hex).toBe('#FF5733');
      expect(result.original).toBe('#FF5733');
    });

    test('should parse rgb colors', () => {
      const result = parseColor('rgb(255, 87, 51)');
      expect(result.rgb).toBe('rgb(255, 87, 51)');
      expect(result.hex).toBeTruthy();
    });

    test('should parse rgba colors', () => {
      const result = parseColor('rgba(255, 87, 51, 0.5)');
      expect(result).toBeTruthy();
    });

    test('should parse hsl colors', () => {
      const result = parseColor('hsl(9, 100%, 60%)');
      expect(result.hsl).toBe('hsl(9, 100%, 60%)');
    });

    test('should parse named colors', () => {
      const result = parseColor('red');
      expect(result.hex).toBe('#ff0000');
    });

    test('should handle transparent colors', () => {
      const result = parseColor('transparent');
      expect(result).toBeNull();
    });

    test('should return null for invalid colors', () => {
      expect(parseColor('notacolor')).toBeNull();
      expect(parseColor('')).toBeNull();
      expect(parseColor(null)).toBeNull();
    });

    test('should handle rgba(0, 0, 0, 0)', () => {
      const result = parseColor('rgba(0, 0, 0, 0)');
      expect(result).toBeNull();
    });
  });

  describe('hexToRgb', () => {
    test('should convert hex to rgb', () => {
      expect(hexToRgb('#FF5733')).toBe('rgb(255, 87, 51)');
      expect(hexToRgb('#000000')).toBe('rgb(0, 0, 0)');
      expect(hexToRgb('#FFFFFF')).toBe('rgb(255, 255, 255)');
    });

    test('should handle lowercase hex', () => {
      expect(hexToRgb('#ff5733')).toBe('rgb(255, 87, 51)');
    });

    test('should return null for invalid hex', () => {
      expect(hexToRgb('notahex')).toBeNull();
      expect(hexToRgb('#GGG')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    test('should convert rgb to hex', () => {
      expect(rgbToHex('rgb(255, 87, 51)')).toBe('#FF5733');
      expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
      expect(rgbToHex('rgb(255, 255, 255)')).toBe('#FFFFFF');
    });

    test('should handle rgba', () => {
      const result = rgbToHex('rgba(255, 87, 51, 0.5)');
      expect(result).toBe('#FF5733');
    });

    test('should return null for invalid rgb', () => {
      expect(rgbToHex('notargb')).toBeNull();
    });
  });

  describe('hexToHsl', () => {
    test('should convert hex to hsl', () => {
      const result = hexToHsl('#FF0000');
      expect(result).toMatch(/hsl\(\d+, \d+%, \d+%\)/);
    });

    test('should handle black and white', () => {
      expect(hexToHsl('#000000')).toMatch(/hsl\(/);
      expect(hexToHsl('#FFFFFF')).toMatch(/hsl\(/);
    });
  });

  describe('hslToHex', () => {
    test('should convert hsl to hex', () => {
      const result = hslToHex('hsl(0, 100%, 50%)');
      expect(result).toMatch(/^#[0-9A-F]{6}$/);
    });

    test('should handle grayscale', () => {
      const result = hslToHex('hsl(0, 0%, 50%)');
      expect(result).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  describe('isValidColor', () => {
    test('should return true for valid colors', () => {
      expect(isValidColor('#FF5733')).toBe(true);
      expect(isValidColor('rgb(255, 87, 51)')).toBe(true);
      expect(isValidColor('red')).toBe(true);
    });

    test('should return false for invalid colors', () => {
      expect(isValidColor('notacolor')).toBe(false);
      expect(isValidColor('transparent')).toBe(false);
      expect(isValidColor('')).toBe(false);
    });
  });

  describe('extractColorsFromElement', () => {
    test('should extract colors from element styles', () => {
      const element = document.createElement('div');
      element.style.color = '#FF5733';
      element.style.backgroundColor = 'rgb(100, 150, 200)';

      const colors = extractColorsFromElement(element);
      expect(colors.length).toBeGreaterThan(0);
      expect(colors.some(c => c.property === 'color')).toBe(true);
    });

    test('should handle element without colors', () => {
      const element = document.createElement('div');
      const colors = extractColorsFromElement(element);
      expect(Array.isArray(colors)).toBe(true);
    });

    test('should skip invalid colors', () => {
      const element = document.createElement('div');
      element.style.color = 'transparent';
      const colors = extractColorsFromElement(element);
      expect(colors.every(c => c.value !== 'transparent')).toBe(true);
    });
  });

  describe('getVisibleBackgroundColor', () => {
    test('should get background color from element', () => {
      const element = document.createElement('div');
      element.style.backgroundColor = '#FF5733';
      document.body.appendChild(element);

      const color = getVisibleBackgroundColor(element);
      expect(color).toBeTruthy();

      document.body.removeChild(element);
    });

    test('should return null if no element provided', () => {
      expect(getVisibleBackgroundColor(null)).toBeNull();
    });

    test('should handle transparent backgrounds', () => {
      const element = document.createElement('div');
      element.style.backgroundColor = 'transparent';

      const color = getVisibleBackgroundColor(element);
      // Should try parent or return null
      expect(typeof color === 'object' || color === null).toBe(true);
    });
  });
});
