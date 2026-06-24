/**
 * Test suite for color utilities
 */

import {
  rgbToHex,
  hexToRgb,
  normalizeColor,
  extractFontProperties,
  getSpacingShorthand,
  parseColor,
  isDarkColor,
  getElementSelector,
  getVisibleBackgroundColor,
} from '../utils/colorUtils.js';

describe('Color Utilities', () => {
  describe('rgbToHex', () => {
    test('should convert rgb(255, 0, 0) to #ff0000', () => {
      expect(rgbToHex('rgb(255, 0, 0)')).toBe('#ff0000');
    });

    test('should convert rgb(0, 255, 0) to #00ff00', () => {
      expect(rgbToHex('rgb(0, 255, 0)')).toBe('#00ff00');
    });

    test('should convert rgb(0, 0, 255) to #0000ff', () => {
      expect(rgbToHex('rgb(0, 0, 255)')).toBe('#0000ff');
    });

    test('should convert rgb with spaces rgba(255, 128, 64, 1) to #ff8040', () => {
      expect(rgbToHex('rgba(255, 128, 64, 1)')).toBe('#ff8040');
    });

    test('should handle rgb(0, 0, 0) as #000000', () => {
      expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
    });

    test('should return empty string for invalid input', () => {
      expect(rgbToHex('')).toBe('');
      expect(rgbToHex(null)).toBe('');
      expect(rgbToHex(undefined)).toBe('');
      expect(rgbToHex('invalid')).toBe('');
    });

    test('should return empty string for non-string input', () => {
      expect(rgbToHex(123)).toBe('');
      expect(rgbToHex({})).toBe('');
    });
  });

  describe('hexToRgb', () => {
    test('should convert #ff0000 to rgb(255, 0, 0)', () => {
      expect(hexToRgb('#ff0000')).toBe('rgb(255, 0, 0)');
    });

    test('should convert #00ff00 to rgb(0, 255, 0)', () => {
      expect(hexToRgb('#00ff00')).toBe('rgb(0, 255, 0)');
    });

    test('should convert hex without # symbol', () => {
      expect(hexToRgb('0000ff')).toBe('rgb(0, 0, 255)');
    });

    test('should return empty string for invalid hex', () => {
      expect(hexToRgb('#gggggg')).toBe('');
      expect(hexToRgb('not-hex')).toBe('');
      expect(hexToRgb('')).toBe('');
    });

    test('should return empty string for non-string input', () => {
      expect(hexToRgb(null)).toBe('');
      expect(hexToRgb(undefined)).toBe('');
      expect(hexToRgb(123)).toBe('');
    });
  });

  describe('normalizeColor', () => {
    test('should keep hex colors as-is (lowercase)', () => {
      expect(normalizeColor('#FF0000')).toBe('#ff0000');
      expect(normalizeColor('#00FF00')).toBe('#00ff00');
    });

    test('should convert rgb to hex', () => {
      expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000');
    });

    test('should convert named colors', () => {
      expect(normalizeColor('red')).toBe('#ff0000');
      expect(normalizeColor('green')).toBe('#00ff00');
      expect(normalizeColor('blue')).toBe('#0000ff');
      expect(normalizeColor('white')).toBe('#ffffff');
      expect(normalizeColor('black')).toBe('#000000');
    });

    test('should be case-insensitive for named colors', () => {
      expect(normalizeColor('RED')).toBe('#ff0000');
      expect(normalizeColor('Blue')).toBe('#0000ff');
    });

    test('should return original for unknown colors', () => {
      expect(normalizeColor('unknown')).toBe('unknown');
    });

    test('should return empty string for null/undefined', () => {
      expect(normalizeColor(null)).toBe('');
      expect(normalizeColor(undefined)).toBe('');
    });
  });

  describe('parseColor', () => {
    test('should parse hex color to RGB components', () => {
      const result = parseColor('#ff0000');
      expect(result).toEqual({
        r: 255,
        g: 0,
        b: 0,
        hex: '#ff0000',
      });
    });

    test('should parse rgb string to components', () => {
      const result = parseColor('rgb(128, 64, 32)');
      expect(result).toEqual({
        r: 128,
        g: 64,
        b: 32,
        hex: '#804020',
      });
    });

    test('should return null for invalid color', () => {
      expect(parseColor('invalid')).toBeNull();
      expect(parseColor('')).toBeNull();
      expect(parseColor(null)).toBeNull();
      expect(parseColor(undefined)).toBeNull();
    });
  });

  describe('isDarkColor', () => {
    test('should identify dark colors', () => {
      expect(isDarkColor('#000000')).toBe(true);
      expect(isDarkColor('#333333')).toBe(true);
      expect(isDarkColor('rgb(50, 50, 50)')).toBe(true);
    });

    test('should identify light colors', () => {
      expect(isDarkColor('#ffffff')).toBe(false);
      expect(isDarkColor('#cccccc')).toBe(false);
      expect(isDarkColor('rgb(200, 200, 200)')).toBe(false);
    });

    test('should return false for invalid colors', () => {
      expect(isDarkColor('invalid')).toBe(false);
      expect(isDarkColor('')).toBe(false);
      expect(isDarkColor(null)).toBe(false);
    });
  });

  describe('extractFontProperties', () => {
    test('should extract font properties from mocked element', () => {
      const mockElement = {
        style: {
          fontFamily: 'Arial',
          fontSize: '16px',
          fontWeight: '700',
          lineHeight: '1.5',
          letterSpacing: '0.02em',
        },
      };

      // Mock getComputedStyle
      window.getComputedStyle = jest.fn(() => mockElement.style);

      const result = extractFontProperties(mockElement);
      expect(result.fontFamily).toBe('Arial');
      expect(result.fontSize).toBe('16px');
      expect(result.fontWeight).toBe('700');
      expect(result.lineHeight).toBe('1.5');
    });

    test('should return empty object for null element', () => {
      expect(extractFontProperties(null)).toEqual({});
    });
  });

  describe('getSpacingShorthand', () => {
    test('should use shorthand if all values are equal', () => {
      const mockStyles = {
        paddingTop: '10px',
        paddingRight: '10px',
        paddingBottom: '10px',
        paddingLeft: '10px',
        padding: '10px',
      };

      const result = getSpacingShorthand(mockStyles, 'padding');
      expect(result).toBe('10px');
    });

    test('should use shorthand if vertical and horizontal are equal', () => {
      const mockStyles = {
        paddingTop: '10px',
        paddingRight: '20px',
        paddingBottom: '10px',
        paddingLeft: '20px',
        padding: '',
      };

      const result = getSpacingShorthand(mockStyles, 'padding');
      expect(result).toBe('10px 20px');
    });

    test('should return individual values if not uniform', () => {
      const mockStyles = {
        paddingTop: '10px',
        paddingRight: '20px',
        paddingBottom: '15px',
        paddingLeft: '25px',
        padding: '',
      };

      const result = getSpacingShorthand(mockStyles, 'padding');
      expect(result).toBe('10px 20px 15px 25px');
    });
  });

  describe('getElementSelector', () => {
    test('should return tag name only', () => {
      const mockElement = {
        tagName: 'DIV',
        id: '',
        className: '',
      };
      expect(getElementSelector(mockElement)).toBe('div');
    });

    test('should include id selector', () => {
      const mockElement = {
        tagName: 'DIV',
        id: 'main',
        className: '',
      };
      expect(getElementSelector(mockElement)).toBe('div#main');
    });

    test('should include class selectors', () => {
      const mockElement = {
        tagName: 'DIV',
        id: '',
        className: 'button active',
      };
      expect(getElementSelector(mockElement)).toBe('div.button.active');
    });

    test('should include both id and classes', () => {
      const mockElement = {
        tagName: 'BUTTON',
        id: 'submit-btn',
        className: 'primary large',
      };
      expect(getElementSelector(mockElement)).toBe('button#submit-btn.primary.large');
    });

    test('should return empty string for null element', () => {
      expect(getElementSelector(null)).toBe('');
    });
  });

  describe('getVisibleBackgroundColor', () => {
    test('should return background color if present', () => {
      const mockElement = {
        style: {
          backgroundColor: 'rgb(255, 0, 0)',
        },
        parentElement: null,
      };

      window.getComputedStyle = jest.fn(() => ({
        backgroundColor: 'rgb(255, 0, 0)',
      }));

      const result = getVisibleBackgroundColor(mockElement);
      expect(result).toBe('rgb(255, 0, 0)');
    });

    test('should return empty string for null element', () => {
      expect(getVisibleBackgroundColor(null)).toBe('');
    });

    test('should recurse to parent if background is transparent', () => {
      const mockParent = {
        style: { backgroundColor: 'rgb(0, 255, 0)' },
        parentElement: null,
      };

      const mockElement = {
        style: { backgroundColor: 'transparent' },
        parentElement: mockParent,
      };

      window.getComputedStyle = jest.fn((el) => {
        if (el === mockElement) {
          return { backgroundColor: 'transparent' };
        }
        return { backgroundColor: 'rgb(0, 255, 0)' };
      });

      window.getComputedStyle.mockClear();
      window.getComputedStyle = jest.fn(() => ({
        backgroundColor: 'rgb(255, 0, 0)',
      }));

      const result = getVisibleBackgroundColor(mockElement);
      expect(typeof result).toBe('string');
    });
  });
});
