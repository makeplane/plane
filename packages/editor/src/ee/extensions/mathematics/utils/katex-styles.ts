/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

/**
 * KaTeX CSS injection utility for secure and reliable styling.
 */

let isKaTeXStylesInjected = false;
let katexStylesPromise: Promise<void> | null = null;

/**
 * Ensures KaTeX styles are loaded before math is rendered.
 */
export function ensureKaTeXStyles(): Promise<void> {
  if (isKaTeXStylesInjected) {
    return Promise.resolve();
  }

  const existingKaTeXStyles =
    document.querySelector('link[rel="stylesheet"][href*="katex"]') ||
    document.querySelector("style[data-katex]") ||
    document.querySelector("style[data-katex-minimal]");

  if (existingKaTeXStyles) {
    isKaTeXStylesInjected = true;
    return Promise.resolve();
  }

  if (katexStylesPromise) {
    return katexStylesPromise;
  }

  katexStylesPromise = import("katex/dist/katex.min.css")
    .then(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            isKaTeXStylesInjected = true;
            resolve();
          });
        })
    )
    .catch(() => {
      injectMinimalKaTeXStyles();
    })
    .finally(() => {
      katexStylesPromise = null;
    });

  return katexStylesPromise;
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
