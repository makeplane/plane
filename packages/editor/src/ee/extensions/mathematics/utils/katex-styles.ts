/**
 * KaTeX CSS injection utility for secure and reliable styling
 * Replaces CDN-based CSS loading with bundled approach
 */

let isKaTeXStylesInjected = false;

/**
 * Injects KaTeX CSS styles into the document head if not already present
 * This ensures proper math rendering without relying on external CDN
 */
export function ensureKaTeXStyles(): void {
  if (isKaTeXStylesInjected) {
    return;
  }

  // Check if KaTeX styles are already loaded (from another source)
  const existingKaTeXStyles =
    document.querySelector('link[href*="katex"]') || document.querySelector("style[data-katex]");

  if (existingKaTeXStyles) {
    isKaTeXStylesInjected = true;
    return;
  }

  // Try to load KaTeX CSS dynamically
  try {
    // Use dynamic import for better bundler compatibility
    // @ts-expect-error Dynamic import
    import("katex/dist/katex.min.css")
      .then(() => {
        isKaTeXStylesInjected = true;
      })
      .catch(() => {
        // Fallback to inline styles if import fails
        injectMinimalKaTeXStyles();
      });
  } catch (error) {
    // Immediate fallback if dynamic import is not supported
    injectMinimalKaTeXStyles();
  }
}

/**
 * Injects minimal inline KaTeX styles as ultimate fallback
 * These are the essential styles needed for basic math rendering
 */
function injectMinimalKaTeXStyles(): void {
  if (document.querySelector("style[data-katex-minimal]")) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-katex-minimal", "true");
  style.textContent = `
    /* Minimal KaTeX styles for fallback */
    .katex {
      font: normal 1.21em KaTeX_Main, "Times New Roman", serif;
      line-height: 1.2;
      text-indent: 0;
      text-rendering: auto;
      border-color: currentColor;
    }
    
    .katex * {
      -ms-high-contrast-adjust: none !important;
      border-color: currentColor;
    }
    
    .katex .katex-mathml {
      position: absolute;
      clip: rect(1px, 1px, 1px, 1px);
      padding: 0;
      border: 0;
      height: 1px;
      width: 1px;
      overflow: hidden;
    }
    
    .katex-display {
      display: block;
      margin: 1em 0;
      text-align: center;
    }
    
    .katex-display > .katex {
      display: block;
      text-align: center;
      white-space: nowrap;
    }
    
    .math-error {
      color: #cc0000;
      font-style: italic;
      background-color: #ffe6e6;
      padding: 2px 4px;
      border-radius: 3px;
      border: 1px solid #ffcccc;
    }
    
    .block-equation-inner {
      min-height: 1.5em;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  document.head.appendChild(style);
  isKaTeXStylesInjected = true;
}
