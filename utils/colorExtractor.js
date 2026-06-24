/**
 * Color extraction utilities for design tokens
 */

/**
 * Parse CSS color value to standard formats
 * @param {string} colorValue - CSS color value (rgb, hex, hsl, etc)
 * @returns {Object} Parsed color with hex, rgb, and hsl representations
 */
export function parseColor(colorValue) {
  if (!colorValue) return null;

  const colorValue_ = colorValue.trim();

  // Already hex format
  if (colorValue_.startsWith('#')) {
    return {
      hex: colorValue_,
      rgb: hexToRgb(colorValue_),
      hsl: hexToHsl(colorValue_),
      original: colorValue_
    };
  }

  // RGB/RGBA format
  if (colorValue_.startsWith('rgb')) {
    // Check for fully transparent rgba (alpha = 0)
    const alphaMatch = colorValue_.match(/,\s*([\d.]+)\s*\)$/);
    if (alphaMatch && parseFloat(alphaMatch[1]) === 0) {
      return null;
    }

    const hex = rgbToHex(colorValue_);
    return {
      hex,
      rgb: colorValue_,
      hsl: hexToHsl(hex),
      original: colorValue_
    };
  }

  // HSL/HSLA format
  if (colorValue_.startsWith('hsl')) {
    const hex = hslToHex(colorValue_);
    return {
      hex,
      rgb: hexToRgb(hex),
      hsl: colorValue_,
      original: colorValue_
    };
  }

  // Named colors - basic set
  const namedColors = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'gray': '#808080',
    'grey': '#808080'
  };

  if (namedColors[colorValue_.toLowerCase()]) {
    const hex = namedColors[colorValue_.toLowerCase()];
    return {
      hex,
      rgb: hexToRgb(hex),
      hsl: hexToHsl(hex),
      original: colorValue_
    };
  }

  return null;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return null;

  const r = parseInt(match[0]);
  const g = parseInt(match[1]);
  const b = parseInt(match[2]);

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

/**
 * Convert hex to HSL
 */
export function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Convert HSL to hex
 */
export function hslToHex(hsl) {
  const match = hsl.match(/\d+/g);
  if (!match || match.length < 3) return null;

  let h = parseInt(match[0]) / 360;
  let s = parseInt(match[1]) / 100;
  let l = parseInt(match[2]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Check if color is valid
 */
export function isValidColor(colorValue) {
  return parseColor(colorValue) !== null;
}

/**
 * Extract all colors from computed styles
 */
export function extractColorsFromElement(element) {
  if (!element) return [];

  const colors = [];
  const styles = window.getComputedStyle(element);

  const colorProps = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textShadowColor',
    'boxShadowColor'
  ];

  colorProps.forEach(prop => {
    const value = styles[prop];
    if (value && isValidColor(value)) {
      const parsed = parseColor(value);
      if (parsed) {
        colors.push({
          property: prop,
          value: value,
          parsed
        });
      }
    }
  });

  return colors;
}

/**
 * Get background color with fallback to parent elements
 */
export function getVisibleBackgroundColor(element) {
  if (!element) return null;

  const styles = window.getComputedStyle(element);
  const bg = styles.backgroundColor;

  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    return parseColor(bg);
  }

  if (element.parentElement && element.parentElement !== document.documentElement) {
    return getVisibleBackgroundColor(element.parentElement);
  }

  return parseColor(bg);
}
