/**
 * Token grouping and organization utilities
 */

/**
 * Group colors by similarity (hue-based clustering)
 */
export function groupColorsBySimilarity(colors) {
  if (!colors || colors.length === 0) return {};

  const groups = {};

  colors.forEach(color => {
    const hue = extractHue(color);
    const group = getColorGroup(hue);

    if (!groups[group]) {
      groups[group] = [];
    }

    groups[group].push(color);
  });

  return groups;
}

/**
 * Extract hue from HSL color string
 */
export function extractHue(color) {
  if (color.hsl) {
    const match = color.hsl.match(/^hsl\((\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  return 0;
}

/**
 * Get color group name by hue
 */
export function getColorGroup(hue) {
  if (hue >= 0 && hue < 30) return 'Red';
  if (hue >= 30 && hue < 60) return 'Orange';
  if (hue >= 60 && hue < 120) return 'Yellow';
  if (hue >= 120 && hue < 180) return 'Green';
  if (hue >= 180 && hue < 240) return 'Cyan';
  if (hue >= 240 && hue < 300) return 'Blue';
  if (hue >= 300 && hue < 360) return 'Magenta';
  return 'Neutral';
}

/**
 * Deduplicate colors (by hex value)
 */
export function deduplicateColors(colors) {
  const seen = new Set();
  const unique = [];

  colors.forEach(color => {
    const key = color.hex || color.original;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(color);
    }
  });

  return unique;
}

/**
 * Sort colors by lightness (for better presentation)
 */
export function sortColorsByLightness(colors) {
  return [...colors].sort((a, b) => {
    const aLight = extractLightness(a);
    const bLight = extractLightness(b);
    return aLight - bLight;
  });
}

/**
 * Extract lightness from HSL color
 */
export function extractLightness(color) {
  if (color.hsl) {
    const match = color.hsl.match(/(\d+)%\)$/);
    return match ? parseInt(match[1]) : 50;
  }
  return 50;
}

/**
 * Group typography styles by similarity
 */
export function groupTypography(typographies) {
  const groups = {};

  typographies.forEach(typo => {
    const fontFamily = (typo.fontFamily && typo.fontFamily[0]) || 'Unknown';
    const fontSize = typo.fontSize?.value || 'unknown';
    const key = `${fontFamily}-${fontSize}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(typo);
  });

  return groups;
}

/**
 * Create a design token palette from extracted data
 */
export function createTokenPalette(extractedData) {
  if (!extractedData) return {};

  const palette = {
    colors: {},
    typography: {},
    spacing: {},
    effects: {}
  };

  // Organize colors
  if (extractedData.colors && extractedData.colors.length > 0) {
    const deduplicated = deduplicateColors(extractedData.colors);
    const grouped = groupColorsBySimilarity(deduplicated);

    Object.keys(grouped).forEach(group => {
      palette.colors[group] = sortColorsByLightness(grouped[group]).map(c => ({
        hex: c.hex,
        rgb: c.rgb,
        hsl: c.hsl
      }));
    });
  }

  // Organize typography
  if (extractedData.typography && extractedData.typography.length > 0) {
    palette.typography = groupTypography(extractedData.typography);
  }

  // Organize spacing
  if (extractedData.spacing && extractedData.spacing.length > 0) {
    palette.spacing = deduplicateSpacing(extractedData.spacing);
  }

  // Organize effects
  if (extractedData.effects && extractedData.effects.length > 0) {
    palette.effects = deduplicateEffects(extractedData.effects);
  }

  return palette;
}

/**
 * Deduplicate spacing values
 */
export function deduplicateSpacing(spacings) {
  const seen = new Set();
  const unique = [];

  spacings.forEach(space => {
    const key = space.original || space;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(space);
    }
  });

  return unique;
}

/**
 * Deduplicate shadow effects
 */
export function deduplicateEffects(effects) {
  const seen = new Set();
  const unique = [];

  effects.forEach(effect => {
    const key = effect.original || JSON.stringify(effect);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(effect);
    }
  });

  return unique;
}

/**
 * Sort tokens alphabetically by group
 */
export function sortTokensByGroup(tokens) {
  const sorted = {};

  Object.keys(tokens)
    .sort()
    .forEach(key => {
      sorted[key] = tokens[key];
    });

  return sorted;
}
