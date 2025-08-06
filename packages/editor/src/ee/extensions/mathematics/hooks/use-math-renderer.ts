import katex from "katex";
import { useEffect, useRef } from "react";
// utils
import { ensureKaTeXStyles } from "../utils/katex-styles";

type UseMathRendererOptions = {
  displayMode?: boolean;
  throwOnError?: boolean;
};

export const useMathRenderer = <T extends HTMLElement = HTMLElement>(
  latex: string,
  options: UseMathRendererOptions = {}
) => {
  const mathRef = useRef<T>(null);
  const { displayMode = false, throwOnError = false } = options;

  useEffect(() => {
    if (!mathRef.current) return;

    // Ensure KaTeX styles are loaded before rendering
    ensureKaTeXStyles();

    katex.render(latex, mathRef.current, {
      displayMode,
      throwOnError,
      strict: "warn", // Allow more LaTeX constructs
    });
  }, [displayMode, latex, throwOnError]);

  return { mathRef };
};
