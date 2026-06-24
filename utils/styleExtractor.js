/**
 * Style extraction utilities for design tokens
 */

/**
 * Parse font family string
 */
export function parseFontFamily(fontFamily) {
  if (!fontFamily) return [];

  return fontFamily
    .split(',')
    .map(f => f.trim().replace(/['"]/g, ''))
    .filter(f => f.length > 0);
}

/**
 * Parse font size value
 */
export function parseFontSize(fontSize) {
  if (!fontSize) return null;

  const match = fontSize.match(/^([\d.]+)(px|em|rem|%|pt)$/);
  if (!match) return { value: fontSize, unit: 'unknown' };

  return {
    value: parseFloat(match[1]),
    unit: match[2],
    original: fontSize,
    inPx: convertToPx(parseFloat(match[1]), match[2])
  };
}

/**
 * Convert font size to pixels
 */
export function convertToPx(value, unit) {
  const baseSize = 16; // Standard base font size
  const conversions = {
    'px': value,
    'em': value * baseSize,
    'rem': value * baseSize,
    '%': value * baseSize / 100,
    'pt': value * 4 / 3
  };

  return conversions[unit] || value;
}

/**
 * Parse font weight
 */
export function parseFontWeight(fontWeight) {
  const weights = {
    'normal': 400,
    'bold': 700,
    'lighter': 300,
    'bolder': 900
  };

  if (weights[fontWeight]) {
    return { name: fontWeight, value: weights[fontWeight] };
  }

  const num = parseInt(fontWeight);
  if (!isNaN(num)) {
    const names = {
      100: 'thin',
      200: 'extra-light',
      300: 'light',
      400: 'normal',
      500: 'medium',
      600: 'semi-bold',
      700: 'bold',
      800: 'extra-bold',
      900: 'black'
    };

    return { name: names[num] || 'unknown', value: num };
  }

  return { name: 'unknown', value: parseInt(fontWeight) || 400 };
}

/**
 * Parse line height
 */
export function parseLineHeight(lineHeight) {
  if (!lineHeight) return null;

  // Unitless number
  if (!isNaN(lineHeight)) {
    return { value: parseFloat(lineHeight), unit: 'unitless', original: lineHeight };
  }

  const match = lineHeight.match(/^([\d.]+)(px|em|rem|%)?$/);
  if (!match) return { original: lineHeight };

  const value = parseFloat(match[1]);
  const unit = match[2] || 'unitless';

  return { value, unit, original: lineHeight };
}

/**
 * Parse spacing values (margin, padding, gap, etc)
 */
export function parseSpacing(value) {
  if (!value) return null;

  const parts = value.split(/\s+/).map(p => {
    const match = p.match(/^([\d.-]+)(px|em|rem|%)?$/);
    if (!match) return null;

    return {
      value: parseFloat(match[1]),
      unit: match[2] || 'px',
      original: p
    };
  }).filter(p => p !== null);

  return parts;
}

/**
 * Parse shorthand properties (margin, padding, border, etc)
 */
export function getShorthand(element, prop) {
  const styles = window.getComputedStyle(element);
  const value = styles[prop];

  if (value && value !== '' && value !== 'rgba(0, 0, 0, 0)') {
    return value;
  }

  // Try to build from component values
  const top = styles[prop + 'Top'] || '0px';
  const right = styles[prop + 'Right'] || '0px';
  const bottom = styles[prop + 'Bottom'] || '0px';
  const left = styles[prop + 'Left'] || '0px';

  // Check if all are equal
  if (top === right && right === bottom && bottom === left) {
    return top;
  }

  // Check if vertical and horizontal are equal
  if (top === bottom && right === left) {
    return `${top} ${right}`;
  }

  return `${top} ${right} ${bottom} ${left}`;
}

/**
 * Parse shadow values (text-shadow, box-shadow)
 */
export function parseShadow(shadowValue) {
  if (!shadowValue || shadowValue === 'none') return [];

  // Split multiple shadows (need to handle commas carefully)
  const shadows = [];
  let current = '';
  let depth = 0;

  for (let char of shadowValue) {
    if (char === '(' || char === 'rgb' || char === 'hsl') depth++;
    if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      shadows.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) shadows.push(current.trim());

  return shadows.map(shadow => {
    const match = shadow.match(/^([\d.-]+px)\s+([\d.-]+px)(?:\s+([\d.-]+px))?(?:\s+([\d.-]+px))?\s+(.+)$/);
    if (!match) return { original: shadow };

    return {
      offsetX: match[1],
      offsetY: match[2],
      blur: match[3] || '0px',
      spread: match[4] || '0px',
      color: match[5],
      original: shadow
    };
  });
}

/**
 * Extract typography from element
 */
export function extractTypography(element) {
  if (!element) return {};

  const styles = window.getComputedStyle(element);

  return {
    fontFamily: parseFontFamily(styles.fontFamily),
    fontSize: parseFontSize(styles.fontSize),
    fontWeight: parseFontWeight(styles.fontWeight),
    lineHeight: parseLineHeight(styles.lineHeight),
    letterSpacing: styles.letterSpacing,
    textTransform: styles.textTransform,
    textDecoration: styles.textDecoration,
    color: styles.color
  };
}

/**
 * Extract spacing from element
 */
export function extractSpacing(element) {
  if (!element) return {};

  return {
    margin: getShorthand(element, 'margin'),
    padding: getShorthand(element, 'padding'),
    gap: window.getComputedStyle(element).gap
  };
}

/**
 * Extract visual effects from element
 */
export function extractVisualEffects(element) {
  if (!element) return {};

  const styles = window.getComputedStyle(element);

  return {
    boxShadow: parseShadow(styles.boxShadow),
    textShadow: parseShadow(styles.textShadow),
    opacity: styles.opacity,
    backgroundColor: styles.backgroundColor,
    borderRadius: styles.borderRadius,
    border: styles.border
  };
}

/**
 * Extract all relevant styles from element
 */
export function extractAllStyles(element) {
  if (!element) return {};

  return {
    selector: getElementSelector(element),
    tag: element.tagName.toLowerCase(),
    classes: element.className ? element.className.split(/\s+/).filter(c => c) : [],
    id: element.id || null,
    typography: extractTypography(element),
    spacing: extractSpacing(element),
    visual: extractVisualEffects(element)
  };
}

/**
 * Generate CSS selector for element
 */
export function getElementSelector(element) {
  const parts = [];
  let current = element;

  while (current && current !== document) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className.split(/\s+/).filter(c => c && !c.startsWith('__'));
      if (classes.length) {
        selector += `.${classes.join('.')}`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;

    // Stop at reasonable depth
    if (parts.length > 5) break;
  }

  return parts.join(' > ');
}
