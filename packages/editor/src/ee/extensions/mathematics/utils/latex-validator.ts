import katex from "katex";

/**
 * Standard error type for LaTeX validation
 */
type LaTeXValidationResult = {
  isValid: boolean;
  errorMessage: string;
};

/**
 * Validates LaTeX syntax without DOM manipulation for better performance
 * Uses KaTeX's internal parsing instead of full rendering
 *
 * @param latex - The LaTeX string to validate
 * @param options - Optional KaTeX render options
 * @returns Validation result with error details
 */
export function validateLaTeX(latex: string, options: katex.KatexOptions = {}): LaTeXValidationResult {
  // Handle empty input
  if (!latex || !latex.trim()) {
    return { isValid: true, errorMessage: "" };
  }

  const trimmedLatex = latex.trim();

  try {
    // Use KaTeX's renderToString for validation without DOM manipulation
    // This is more efficient than creating DOM elements
    katex.renderToString(trimmedLatex, {
      throwOnError: true,
      displayMode: options.displayMode || false,
      strict: "warn", // Allow more LaTeX constructs
      ...options,
    });

    return { isValid: true, errorMessage: "" };
  } catch (error) {
    let errorMessage = "Invalid LaTeX syntax";

    if (error instanceof Error) {
      // Clean up KaTeX error messages for better UX
      let message = error.message;

      // Remove KaTeX-specific prefixes
      message = message.replace(/^KaTeX parse error: /, "");
      message = message.replace(/^ParseError: /, "");

      // Capitalize first letter if it's not already
      if (message.length > 0) {
        message = message.charAt(0).toUpperCase() + message.slice(1);
      }

      errorMessage = message || errorMessage;
    }

    return {
      isValid: false,
      errorMessage,
    };
  }
}
