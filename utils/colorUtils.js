/**
 * Color and Style Extraction Utilities
 * Extracted from editor.js - pure functions for testing
 */

/**
 * Get the visible background color of an element
 * @param {Element} el - DOM element to inspect
 * @returns {string} Background color in RGB or hex format
 */
export function getVisibleBackgroundColor(el) {
  if (!el) return '';
  
  const styles = window.getComputedStyle(el);
  const bg = styles.backgroundColor;
  
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    return bg;
  }
  
  if (el.parentElement && el.parentElement !== document.documentElement) {
    return getVisibleBackgroundColor(el.parentElement);
  }
  
  return bg || '';
}

/**
 * Convert RGB to Hex format
 * @param {string} rgb - RGB color string like "rgb(255, 0, 0)"
 * @returns {string} Hex color like "#ff0000"
 */
export function rgbToHex(rgb) {
  if (!rgb || typeof rgb !== 'string') return '';
  
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return '';
  
  const [r, g, b] = match.slice(0, 3).map(Number);
  
  if (r === undefined || g === undefined || b === undefined) return '';
  
  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('')
    .toLowerCase();
}

/**
 * Convert Hex to RGB format
 * @param {string} hex - Hex color like "#ff0000"
 * @returns {string} RGB color like "rgb(255, 0, 0)"
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '';
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Normalize color format to hex
 * @param {string} color - Color in any format (rgb, hex, named)
 * @returns {string} Normalized hex color
 */
export function normalizeColor(color) {
  if (!color || typeof color !== 'string') return '';
  
  // Already hex
  if (color.startsWith('#')) return color.toLowerCase();
  
  // RGB format
  if (color.startsWith('rgb')) {
    return rgbToHex(color);
  }
  
  // Named colors - basic mapping
  const namedColors = {
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    white: '#ffffff',
    black: '#000000',
    gray: '#808080',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
  };
  
  return namedColors[color.toLowerCase()] || color;
}

/**
 * Extract font properties from element
 * @param {Element} el - DOM element
 * @returns {Object} Font properties
 */
export function extractFontProperties(el) {
  if (!el) return {};
  
  const styles = window.getComputedStyle(el);
  return {
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing,
  };
}

/**
 * Extract spacing properties with fallback for shorthand
 * @param {CSSStyleDeclaration} styles - Computed styles
 * @param {string} prop - Property name (e.g., "padding", "margin")
 * @returns {string} Spacing value
 */
export function getSpacingShorthand(styles, prop) {
  const val = styles[prop];
  if (val && val !== '' && val !== '0px') return val;
  
  const top = styles[prop + 'Top'] || '0px';
  const right = styles[prop + 'Right'] || '0px';
  const bottom = styles[prop + 'Bottom'] || '0px';
  const left = styles[prop + 'Left'] || '0px';
  
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && left === right) return `${top} ${left}`;
  
  return `${top} ${right} ${bottom} ${left}`;
}

/**
 * Parse color from string to component values
 * @param {string} color - Color string in hex or rgb format
 * @returns {Object|null} Object with r, g, b, a properties or null
 */
export function parseColor(color) {
  if (!color || typeof color !== 'string') return null;
  
  let hex = color;
  if (color.startsWith('rgb')) {
    hex = rgbToHex(color);
  }
  
  if (!hex.startsWith('#')) return null;
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    hex: hex.toLowerCase(),
  };
}

/**
 * Check if a color is dark
 * @param {string} color - Color in hex or rgb format
 * @returns {boolean} True if color is dark
 */
export function isDarkColor(color) {
  const parsed = parseColor(color);
  if (!parsed) return false;
  
  // Luminance calculation
  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255;
  return luminance < 0.5;
}

/**
 * Get element selector (id, class, tag)
 * @param {Element} el - DOM element
 * @returns {string} CSS selector
 */
export function getElementSelector(el) {
  if (!el) return '';
  
  const tagName = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
  
  return `${tagName}${id}${className}`;
}
