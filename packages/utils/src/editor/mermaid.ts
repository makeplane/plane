/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * @description the language identifier used for Mermaid diagram code blocks
 */
export const MERMAID_LANGUAGE = "mermaid";

/**
 * @description check if a code block language attribute refers to a Mermaid diagram
 * @param {unknown} language
 */
export const isMermaidLanguage = (language: unknown): boolean =>
  typeof language === "string" && language.trim().toLowerCase() === MERMAID_LANGUAGE;

export type TMermaidTheme = "default" | "dark";

/**
 * @description resolve the Mermaid theme from a `data-theme` attribute value
 * (e.g. set by next-themes). Values containing "dark" (dark, dark-contrast)
 * map to Mermaid's dark theme; everything else maps to the default theme.
 * @param {string | null | undefined} themeAttribute
 */
export const getMermaidTheme = (themeAttribute: string | null | undefined): TMermaidTheme =>
  !!themeAttribute && themeAttribute.includes("dark") ? "dark" : "default";

/**
 * @description extract a human-readable message from a Mermaid render failure
 * @param {unknown} error
 */
export const formatMermaidError = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error) {
    return error;
  }
  return "Unable to render the diagram. Please check the Mermaid syntax.";
};
