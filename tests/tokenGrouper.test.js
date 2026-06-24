import {
  groupColorsBySimilarity,
  extractHue,
  getColorGroup,
  deduplicateColors,
  sortColorsByLightness,
  extractLightness,
  groupTypography,
  createTokenPalette,
  deduplicateSpacing,
  deduplicateEffects,
  sortTokensByGroup
} from '../utils/tokenGrouper.js';

describe('Token Grouping', () => {
  describe('extractHue', () => {
    test('should extract hue from color object', () => {
      const color = {
        hex: '#FF0000',
        hsl: 'hsl(0, 100%, 50%)'
      };
      const hue = extractHue(color);
      expect(hue).toBe(0);
    });

    test('should return 0 for invalid color', () => {
      const hue = extractHue({});
      expect(hue).toBe(0);
    });
  });

  describe('getColorGroup', () => {
    test('should group red colors', () => {
      expect(getColorGroup(0)).toBe('Red');
      expect(getColorGroup(15)).toBe('Red');
    });

    test('should group yellow colors', () => {
      expect(getColorGroup(60)).toBe('Yellow');
      expect(getColorGroup(90)).toBe('Yellow');
    });

    test('should group green colors', () => {
      expect(getColorGroup(120)).toBe('Green');
      expect(getColorGroup(180)).toBe('Cyan');
    });

    test('should group blue colors', () => {
      expect(getColorGroup(240)).toBe('Blue');
    });

    test('should group magenta colors', () => {
      expect(getColorGroup(300)).toBe('Magenta');
    });
  });

  describe('deduplicateColors', () => {
    test('should remove duplicate colors', () => {
      const colors = [
        { hex: '#FF0000', rgb: 'rgb(255, 0, 0)' },
        { hex: '#FF0000', rgb: 'rgb(255, 0, 0)' },
        { hex: '#00FF00', rgb: 'rgb(0, 255, 0)' }
      ];

      const unique = deduplicateColors(colors);
      expect(unique.length).toBe(2);
    });

    test('should preserve order of first occurrence', () => {
      const colors = [
        { hex: '#FF0000' },
        { hex: '#00FF00' },
        { hex: '#FF0000' }
      ];

      const unique = deduplicateColors(colors);
      expect(unique[0].hex).toBe('#FF0000');
      expect(unique[1].hex).toBe('#00FF00');
    });

    test('should handle empty array', () => {
      expect(deduplicateColors([])).toEqual([]);
    });
  });

  describe('extractLightness', () => {
    test('should extract lightness from HSL', () => {
      const color = {
        hsl: 'hsl(0, 100%, 50%)'
      };
      const lightness = extractLightness(color);
      expect(lightness).toBe(50);
    });

    test('should return 50 for invalid color', () => {
      expect(extractLightness({})).toBe(50);
    });
  });

  describe('sortColorsByLightness', () => {
    test('should sort colors from dark to light', () => {
      const colors = [
        { hsl: 'hsl(0, 100%, 50%)' },
        { hsl: 'hsl(0, 100%, 20%)' },
        { hsl: 'hsl(0, 100%, 80%)' }
      ];

      const sorted = sortColorsByLightness(colors);
      expect(extractLightness(sorted[0])).toBeLessThanOrEqual(extractLightness(sorted[1]));
      expect(extractLightness(sorted[1])).toBeLessThanOrEqual(extractLightness(sorted[2]));
    });

    test('should not mutate original array', () => {
      const colors = [
        { hsl: 'hsl(0, 100%, 50%)' },
        { hsl: 'hsl(0, 100%, 20%)' }
      ];

      const original = JSON.stringify(colors);
      sortColorsByLightness(colors);
      expect(JSON.stringify(colors)).toBe(original);
    });
  });

  describe('groupColorsBySimilarity', () => {
    test('should group colors by hue', () => {
      const colors = [
        { hex: '#FF0000', hsl: 'hsl(0, 100%, 50%)' },
        { hex: '#FF3300', hsl: 'hsl(15, 100%, 50%)' },
        { hex: '#00FF00', hsl: 'hsl(120, 100%, 50%)' }
      ];

      const groups = groupColorsBySimilarity(colors);
      expect(Object.keys(groups).length).toBeGreaterThan(0);
      expect(groups['Red']).toBeTruthy();
      expect(groups['Green']).toBeTruthy();
    });

    test('should return empty object for empty array', () => {
      expect(groupColorsBySimilarity([])).toEqual({});
    });

    test('should return empty object for null', () => {
      expect(groupColorsBySimilarity(null)).toEqual({});
    });
  });

  describe('groupTypography', () => {
    test('should group typography by font and size', () => {
      const typographies = [
        { fontFamily: ['Arial'], fontSize: { value: 16 } },
        { fontFamily: ['Arial'], fontSize: { value: 16 } },
        { fontFamily: ['Helvetica'], fontSize: { value: 14 } }
      ];

      const groups = groupTypography(typographies);
      expect(Object.keys(groups).length).toBeGreaterThanOrEqual(2);
    });

    test('should handle missing font info', () => {
      const typographies = [
        { fontSize: { value: 16 } },
        {}
      ];

      const groups = groupTypography(typographies);
      expect(typeof groups).toBe('object');
    });
  });

  describe('deduplicateSpacing', () => {
    test('should remove duplicate spacing', () => {
      const spacings = [
        { original: '10px' },
        { original: '10px' },
        { original: '20px' }
      ];

      const unique = deduplicateSpacing(spacings);
      expect(unique.length).toBe(2);
    });

    test('should handle empty array', () => {
      expect(deduplicateSpacing([])).toEqual([]);
    });
  });

  describe('deduplicateEffects', () => {
    test('should remove duplicate effects', () => {
      const effects = [
        { original: 'shadow1' },
        { original: 'shadow1' },
        { original: 'shadow2' }
      ];

      const unique = deduplicateEffects(effects);
      expect(unique.length).toBe(2);
    });
  });

  describe('sortTokensByGroup', () => {
    test('should sort tokens alphabetically', () => {
      const tokens = {
        'Zebra': [],
        'Apple': [],
        'Middle': []
      };

      const sorted = sortTokensByGroup(tokens);
      const keys = Object.keys(sorted);
      expect(keys[0]).toBe('Apple');
      expect(keys[1]).toBe('Middle');
      expect(keys[2]).toBe('Zebra');
    });

    test('should not mutate original object', () => {
      const tokens = { 'Z': [], 'A': [] };
      const original = JSON.stringify(tokens);
      sortTokensByGroup(tokens);
      expect(JSON.stringify(tokens)).toBe(original);
    });
  });

  describe('createTokenPalette', () => {
    test('should create palette from extracted data', () => {
      const data = {
        colors: [
          { hex: '#FF0000', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#00FF00', hsl: 'hsl(120, 100%, 50%)' }
        ],
        typography: [],
        spacing: [],
        effects: []
      };

      const palette = createTokenPalette(data);
      expect(palette).toHaveProperty('colors');
      expect(palette).toHaveProperty('typography');
      expect(palette).toHaveProperty('spacing');
      expect(palette).toHaveProperty('effects');
      expect(Object.keys(palette.colors).length).toBeGreaterThan(0);
    });

    test('should handle empty data', () => {
      const palette = createTokenPalette({});
      expect(palette).toEqual({
        colors: {},
        typography: {},
        spacing: {},
        effects: {}
      });
    });

    test('should deduplicate and organize colors', () => {
      const data = {
        colors: [
          { hex: '#FF0000', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#FF0000', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#00FF00', hsl: 'hsl(120, 100%, 50%)' }
        ],
        typography: [],
        spacing: [],
        effects: []
      };

      const palette = createTokenPalette(data);
      const totalColors = Object.values(palette.colors).reduce((sum, group) => sum + group.length, 0);
      expect(totalColors).toBe(2); // Deduplicated
    });
  });
});
