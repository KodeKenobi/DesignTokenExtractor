/**
 * Token Extraction and Formatting Utilities
 */

/**
 * Extract design tokens from an object (colors, sizes, fonts, etc.)
 * @param {Object} styles - Style properties object
 * @returns {Object} Extracted tokens organized by type
 */
export function extractTokens(styles) {
  if (!styles || typeof styles !== 'object') {
    return { colors: [], sizes: [], fonts: [], spacing: [] };
  }

  return {
    colors: extractColorTokens(styles),
    sizes: extractSizeTokens(styles),
    fonts: extractFontTokens(styles),
    spacing: extractSpacingTokens(styles),
  };
}

/**
 * Extract color tokens
 * @param {Object} styles - Style properties
 * @returns {Array<string>} Array of unique colors
 */
export function extractColorTokens(styles) {
  const colors = new Set();
  
  const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
  colorProps.forEach(prop => {
    if (styles[prop] && styles[prop] !== 'transparent' && styles[prop] !== 'rgba(0, 0, 0, 0)') {
      colors.add(styles[prop]);
    }
  });
  
  return Array.from(colors);
}

/**
 * Extract size tokens (font sizes, widths, heights)
 * @param {Object} styles - Style properties
 * @returns {Array<string>} Array of unique sizes
 */
export function extractSizeTokens(styles) {
  const sizes = new Set();
  
  const sizeProps = ['fontSize', 'width', 'height', 'borderRadius'];
  sizeProps.forEach(prop => {
    if (styles[prop]) {
      sizes.add(styles[prop]);
    }
  });
  
  return Array.from(sizes);
}

/**
 * Extract font tokens
 * @param {Object} styles - Style properties
 * @returns {Array<Object>} Array of font objects with family, size, weight
 */
export function extractFontTokens(styles) {
  const fonts = [];
  
  if (styles.fontFamily) {
    fonts.push({
      family: styles.fontFamily,
      size: styles.fontSize || '',
      weight: styles.fontWeight || '400',
    });
  }
  
  return fonts;
}

/**
 * Extract spacing tokens (padding, margin)
 * @param {Object} styles - Style properties
 * @returns {Array<string>} Array of spacing values
 */
export function extractSpacingTokens(styles) {
  const spacing = new Set();
  
  const spacingProps = ['padding', 'margin', 'gap'];
  spacingProps.forEach(prop => {
    if (styles[prop]) {
      spacing.add(styles[prop]);
    }
  });
  
  return Array.from(spacing);
}

/**
 * Deduplicate tokens from multiple elements
 * @param {Array<Object>} tokenArray - Array of token objects
 * @param {string} key - Property to use for deduplication
 * @returns {Array<Object>} Deduplicated tokens
 */
export function deduplicateTokens(tokenArray, key) {
  if (!Array.isArray(tokenArray)) return [];
  
  const seen = new Set();
  return tokenArray.filter(token => {
    const value = token[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Format token for export (JSON, CSS, etc.)
 * @param {Object} token - Token object
 * @param {string} format - Export format ('json', 'css', 'scss')
 * @returns {string} Formatted token
 */
export function formatToken(token, format = 'json') {
  if (!token || typeof token !== 'object') return '';
  
  switch (format) {
    case 'css':
      return formatTokenAsCSS(token);
    case 'scss':
      return formatTokenAsSCSS(token);
    case 'json':
    default:
      return JSON.stringify(token, null, 2);
  }
}

/**
 * Format token as CSS custom property
 * @param {Object} token - Token with name and value
 * @returns {string} CSS custom property definition
 */
export function formatTokenAsCSS(token) {
  if (!token || !token.name || !token.value) return '';
  return `--${token.name}: ${token.value};`;
}

/**
 * Format token as SCSS variable
 * @param {Object} token - Token with name and value
 * @returns {string} SCSS variable definition
 */
export function formatTokenAsSCSS(token) {
  if (!token || !token.name || !token.value) return '';
  return `$${token.name}: ${token.value};`;
}

/**
 * Generate token name from property and value
 * @param {string} property - CSS property name
 * @param {string} value - CSS property value
 * @returns {string} Generated token name
 */
export function generateTokenName(property, value) {
  if (!property) return '';
  
  // Clean property name
  let name = property
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
  
  // Add value suffix if it looks like it would be helpful
  if (value && typeof value === 'string') {
    const cleanValue = value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 6);
    
    if (cleanValue) {
      name += `-${cleanValue}`;
    }
  }
  
  return name;
}

/**
 * Check if a token already exists in array
 * @param {Array<Object>} tokens - Array of tokens
 * @param {Object} newToken - Token to check
 * @returns {boolean} True if token exists
 */
export function tokenExists(tokens, newToken) {
  if (!Array.isArray(tokens) || !newToken) return false;
  
  return tokens.some(token => 
    token.name === newToken.name || 
    token.value === newToken.value
  );
}

/**
 * Validate token object
 * @param {Object} token - Token to validate
 * @returns {boolean} True if token is valid
 */
export function isValidToken(token) {
  return (
    token &&
    typeof token === 'object' &&
    'name' in token &&
    'value' in token &&
    typeof token.name === 'string' &&
    token.name.trim().length > 0 &&
    typeof token.value === 'string' &&
    token.value.trim().length > 0
  );
}

/**
 * Sort tokens by type and value
 * @param {Array<Object>} tokens - Tokens to sort
 * @returns {Array<Object>} Sorted tokens
 */
export function sortTokens(tokens) {
  if (!Array.isArray(tokens)) return [];
  
  return [...tokens].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.name.localeCompare(b.name);
  });
}
