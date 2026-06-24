/**
 * Test suite for token utilities
 */

import {
  extractTokens,
  extractColorTokens,
  extractSizeTokens,
  extractFontTokens,
  extractSpacingTokens,
  deduplicateTokens,
  formatToken,
  formatTokenAsCSS,
  formatTokenAsSCSS,
  generateTokenName,
  tokenExists,
  isValidToken,
  sortTokens,
} from '../utils/tokenUtils.js';

describe('Token Utilities', () => {
  describe('extractColorTokens', () => {
    test('should extract color tokens from styles', () => {
      const styles = {
        color: '#ff0000',
        backgroundColor: '#00ff00',
        borderColor: '#0000ff',
      };
      const result = extractColorTokens(styles);
      expect(result).toContain('#ff0000');
      expect(result).toContain('#00ff00');
      expect(result).toContain('#0000ff');
    });

    test('should ignore transparent colors', () => {
      const styles = {
        color: '#ff0000',
        backgroundColor: 'transparent',
        borderColor: 'rgba(0, 0, 0, 0)',
      };
      const result = extractColorTokens(styles);
      expect(result).toContain('#ff0000');
      expect(result).not.toContain('transparent');
      expect(result).not.toContain('rgba(0, 0, 0, 0)');
    });

    test('should return empty array for empty styles', () => {
      expect(extractColorTokens({})).toEqual([]);
      expect(extractColorTokens(null)).toEqual([]);
    });

    test('should ignore undefined properties', () => {
      const styles = {
        color: '#ff0000',
        backgroundColor: undefined,
      };
      const result = extractColorTokens(styles);
      expect(result).toContain('#ff0000');
      expect(result.length).toBe(1);
    });
  });

  describe('extractSizeTokens', () => {
    test('should extract size tokens from styles', () => {
      const styles = {
        fontSize: '16px',
        width: '100%',
        height: '50px',
        borderRadius: '8px',
      };
      const result = extractSizeTokens(styles);
      expect(result).toContain('16px');
      expect(result).toContain('100%');
      expect(result).toContain('50px');
      expect(result).toContain('8px');
    });

    test('should ignore undefined properties', () => {
      const styles = {
        fontSize: '14px',
        width: undefined,
      };
      const result = extractSizeTokens(styles);
      expect(result).toContain('14px');
      expect(result.length).toBe(1);
    });
  });

  describe('extractFontTokens', () => {
    test('should extract font tokens from styles', () => {
      const styles = {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontWeight: '700',
      };
      const result = extractFontTokens(styles);
      expect(result.length).toBe(1);
      expect(result[0].family).toBe('Arial, sans-serif');
      expect(result[0].size).toBe('16px');
      expect(result[0].weight).toBe('700');
    });

    test('should default weight to 400 if not specified', () => {
      const styles = {
        fontFamily: 'Arial',
        fontSize: '14px',
      };
      const result = extractFontTokens(styles);
      expect(result[0].weight).toBe('400');
    });

    test('should return empty array if no font family', () => {
      const styles = {
        fontSize: '16px',
        fontWeight: '700',
      };
      const result = extractFontTokens(styles);
      expect(result).toEqual([]);
    });
  });

  describe('extractSpacingTokens', () => {
    test('should extract spacing tokens', () => {
      const styles = {
        padding: '10px',
        margin: '20px',
        gap: '5px',
      };
      const result = extractSpacingTokens(styles);
      expect(result).toContain('10px');
      expect(result).toContain('20px');
      expect(result).toContain('5px');
    });

    test('should ignore undefined properties', () => {
      const styles = {
        padding: '10px',
        margin: undefined,
      };
      const result = extractSpacingTokens(styles);
      expect(result).toContain('10px');
      expect(result.length).toBe(1);
    });
  });

  describe('extractTokens', () => {
    test('should extract all token types', () => {
      const styles = {
        color: '#ff0000',
        fontSize: '16px',
        fontFamily: 'Arial',
        padding: '10px',
      };
      const result = extractTokens(styles);
      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('sizes');
      expect(result).toHaveProperty('fonts');
      expect(result).toHaveProperty('spacing');
    });

    test('should return empty arrays for null input', () => {
      const result = extractTokens(null);
      expect(result.colors).toEqual([]);
      expect(result.sizes).toEqual([]);
      expect(result.fonts).toEqual([]);
      expect(result.spacing).toEqual([]);
    });
  });

  describe('deduplicateTokens', () => {
    test('should remove duplicate tokens', () => {
      const tokens = [
        { name: 'color1', value: '#ff0000' },
        { name: 'color2', value: '#ff0000' },
        { name: 'color3', value: '#00ff00' },
      ];
      const result = deduplicateTokens(tokens, 'value');
      expect(result.length).toBe(2);
    });

    test('should return empty array for non-array input', () => {
      expect(deduplicateTokens(null, 'value')).toEqual([]);
      expect(deduplicateTokens(undefined, 'value')).toEqual([]);
      expect(deduplicateTokens({}, 'value')).toEqual([]);
    });

    test('should preserve order of first occurrence', () => {
      const tokens = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
        { id: 3, value: 'a' },
      ];
      const result = deduplicateTokens(tokens, 'value');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('formatToken', () => {
    const token = { name: 'primary-color', value: '#ff0000' };

    test('should format token as JSON by default', () => {
      const result = formatToken(token, 'json');
      expect(JSON.parse(result)).toEqual(token);
    });

    test('should format token as CSS', () => {
      const result = formatToken(token, 'css');
      expect(result).toBe('--primary-color: #ff0000;');
    });

    test('should format token as SCSS', () => {
      const result = formatToken(token, 'scss');
      expect(result).toBe('$primary-color: #ff0000;');
    });

    test('should return empty string for invalid input', () => {
      expect(formatToken(null, 'css')).toBe('');
      expect(formatToken({}, 'css')).toBe('');
    });
  });

  describe('formatTokenAsCSS', () => {
    test('should format token as CSS custom property', () => {
      const result = formatTokenAsCSS({ name: 'primary', value: '#ff0000' });
      expect(result).toBe('--primary: #ff0000;');
    });

    test('should return empty string for invalid token', () => {
      expect(formatTokenAsCSS(null)).toBe('');
      expect(formatTokenAsCSS({ name: 'test' })).toBe('');
      expect(formatTokenAsCSS({ value: '#ff0000' })).toBe('');
    });
  });

  describe('formatTokenAsSCSS', () => {
    test('should format token as SCSS variable', () => {
      const result = formatTokenAsSCSS({ name: 'primary-color', value: '#ff0000' });
      expect(result).toBe('$primary-color: #ff0000;');
    });

    test('should return empty string for invalid token', () => {
      expect(formatTokenAsSCSS(null)).toBe('');
      expect(formatTokenAsSCSS({ name: 'test' })).toBe('');
      expect(formatTokenAsSCSS({ value: '#ff0000' })).toBe('');
    });
  });

  describe('generateTokenName', () => {
    test('should generate name from camelCase property', () => {
      const result = generateTokenName('backgroundColor', '#ff0000');
      expect(result).toBe('background-color-ff');
    });

    test('should handle single word properties', () => {
      const result = generateTokenName('color', '#ff0000');
      expect(result).toBe('color-ff');
    });

    test('should handle values with special characters', () => {
      const result = generateTokenName('padding', '10px');
      expect(result).toBe('padding-10p');
    });

    test('should return empty string for empty property', () => {
      expect(generateTokenName('', '#ff0000')).toBe('');
      expect(generateTokenName(null, '#ff0000')).toBe('');
    });

    test('should return property name only if no value', () => {
      const result = generateTokenName('fontSize', '');
      expect(result).toBe('font-size');
    });
  });

  describe('tokenExists', () => {
    test('should find existing token by name', () => {
      const tokens = [
        { name: 'color-red', value: '#ff0000' },
        { name: 'color-blue', value: '#0000ff' },
      ];
      const exists = tokenExists(tokens, { name: 'color-red', value: '#ff0000' });
      expect(exists).toBe(true);
    });

    test('should find existing token by value', () => {
      const tokens = [
        { name: 'color-red', value: '#ff0000' },
        { name: 'color-danger', value: '#ff0000' },
      ];
      const exists = tokenExists(tokens, { name: 'primary-red', value: '#ff0000' });
      expect(exists).toBe(true);
    });

    test('should return false if token not found', () => {
      const tokens = [
        { name: 'color-red', value: '#ff0000' },
      ];
      const exists = tokenExists(tokens, { name: 'color-green', value: '#00ff00' });
      expect(exists).toBe(false);
    });

    test('should return false for non-array input', () => {
      expect(tokenExists(null, { name: 'test', value: '10px' })).toBe(false);
      expect(tokenExists({}, { name: 'test', value: '10px' })).toBe(false);
    });
  });

  describe('isValidToken', () => {
    test('should validate correct token', () => {
      const token = { name: 'color-red', value: '#ff0000' };
      expect(isValidToken(token)).toBe(true);
    });

    test('should reject token with empty name', () => {
      expect(isValidToken({ name: '', value: '#ff0000' })).toBe(false);
      expect(isValidToken({ name: '   ', value: '#ff0000' })).toBe(false);
    });

    test('should reject token with empty value', () => {
      expect(isValidToken({ name: 'color', value: '' })).toBe(false);
      expect(isValidToken({ name: 'color', value: '   ' })).toBe(false);
    });

    test('should reject token with missing properties', () => {
      expect(isValidToken({ name: 'color' })).toBe(false);
      expect(isValidToken({ value: '#ff0000' })).toBe(false);
      expect(isValidToken({})).toBe(false);
    });

    test('should reject null or non-object', () => {
      expect(isValidToken(null)).toBe(false);
      expect(isValidToken(undefined)).toBe(false);
      expect(isValidToken('string')).toBe(false);
    });
  });

  describe('sortTokens', () => {
    test('should sort tokens by type then name', () => {
      const tokens = [
        { name: 'z-color', type: 'color', value: '#ff0000' },
        { name: 'a-color', type: 'color', value: '#00ff00' },
        { name: 'size', type: 'size', value: '16px' },
      ];
      const result = sortTokens(tokens);
      expect(result[0].type).toBe('color');
      expect(result[0].name).toBe('a-color');
      expect(result[2].type).toBe('size');
    });

    test('should return empty array for non-array input', () => {
      expect(sortTokens(null)).toEqual([]);
      expect(sortTokens(undefined)).toEqual([]);
      expect(sortTokens({})).toEqual([]);
    });

    test('should not modify original array', () => {
      const tokens = [
        { name: 'b', type: 'color', value: '#ff0000' },
        { name: 'a', type: 'color', value: '#00ff00' },
      ];
      const result = sortTokens(tokens);
      expect(tokens[0].name).toBe('b');
      expect(result[0].name).toBe('a');
    });
  });
});
