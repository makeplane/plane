/**
 * Brand Token Utilities
 * 
 * Utilities for managing and updating brand design tokens at runtime.
 * This allows for dynamic rebranding without rebuilding the application.
 */

/**
 * Update brand color tokens at runtime
 * 
 * @param tokens - Object mapping token names (without --brand- prefix) to RGB values
 * @example
 * updateBrandTokens({
 *   '500': '14, 165, 233',  // Update primary brand color
 *   '600': '2, 132, 199',   // Update secondary brand color
 *   'primary': '14, 165, 233',  // Update semantic primary
 * });
 */
export function updateBrandTokens(tokens: Record<string, string>): void {
  if (typeof document === 'undefined') {
    console.warn('updateBrandTokens: document is not available (SSR)');
    return;
  }

  const root = document.documentElement;
  
  Object.entries(tokens).forEach(([key, value]) => {
    // Handle semantic tokens (primary, secondary, etc.)
    if (key === 'primary' || key === 'secondary' || key === 'contrast' || key === 'text') {
      root.style.setProperty(`--brand-${key}`, value);
    } else {
      // Handle numeric tokens (50, 100, 500, etc.)
      root.style.setProperty(`--brand-${key}`, value);
    }
  });
}

/**
 * Get current brand token value
 * 
 * @param tokenName - Token name (e.g., '500', 'primary', 'contrast')
 * @returns Current RGB value or null if not found
 */
export function getBrandToken(tokenName: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--brand-${tokenName}`).trim();
  
  return value || null;
}

/**
 * Reset brand tokens to default values
 * 
 * This removes any runtime overrides and restores CSS default values.
 */
export function resetBrandTokens(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const brandTokens = [
    '50', '100', '200', '300', '400', '500', '600', '700', '800', '900',
    'primary', 'secondary', 'contrast', 'text'
  ];

  brandTokens.forEach(token => {
    root.style.removeProperty(`--brand-${token}`);
  });
}

/**
 * Apply brand tokens from a configuration object
 * 
 * @param config - Complete brand token configuration
 * @example
 * applyBrandConfig({
 *   colors: {
 *     500: '14, 165, 233',
 *     600: '2, 132, 199',
 *   },
 *   semantic: {
 *     primary: '14, 165, 233',
 *     secondary: '2, 132, 199',
 *   }
 * });
 */
export function applyBrandConfig(config: {
  colors?: Record<string, string>;
  semantic?: Record<string, string>;
}): void {
  if (config.colors) {
    updateBrandTokens(config.colors);
  }
  
  if (config.semantic) {
    updateBrandTokens(config.semantic);
  }
}

