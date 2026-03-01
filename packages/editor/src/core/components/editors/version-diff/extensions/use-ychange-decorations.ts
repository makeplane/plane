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

import { useMemo } from "react";
import type { Decoration } from "@tiptap/pm/view";

type YChangeType = "added" | "removed" | null;

/**
 * Result of extracting ychange information from decorations.
 */
export type YChangeDecorationInfo = {
  /** Whether this node has ychange decorations applied */
  hasYChange: boolean;
  /** The type of change: "added", "removed", or null */
  type: YChangeType;
  /** User who made the change */
  user: string | null;
  /** CSS classes to apply to the wrapper element */
  className: string;
  /** Inline styles to apply (CSS variables for per-user colors) */
  style: React.CSSProperties;
  /** Data attributes to spread onto the element */
  dataAttrs: {
    "data-ychange-type"?: string;
    "data-ychange-user"?: string;
  };
};

/**
 * Parse CSS variables and other properties from inline style string.
 */
function parseStyleString(styleString: string): React.CSSProperties {
  const result: Record<string, string> = {};
  if (!styleString) return result;

  const rules = styleString
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const rule of rules) {
    const colonIndex = rule.indexOf(":");
    if (colonIndex === -1) continue;
    const property = rule.slice(0, colonIndex).trim();
    const value = rule.slice(colonIndex + 1).trim();
    if (property && value) {
      result[property] = value;
    }
  }

  return result;
}

/**
 * Extract ychange decoration info from a single decoration.
 *
 * Note: For node decorations, ychange data is stored in decoration.spec.ychangeAttrs
 * (not in DOM attrs) to prevent ProseMirror from auto-applying attributes to NodeView.dom.
 */
function extractYChangeFromDecoration(decoration: Decoration): YChangeDecorationInfo | null {
  // Get ychangeAttrs from spec - this is where we store the data to avoid
  // ProseMirror auto-applying attributes to NodeView.dom
  const spec = (decoration as { spec?: { ychangeAttrs?: Record<string, string> } }).spec;
  const attrs = spec?.ychangeAttrs;

  if (!attrs) return null;

  // Check if this is a ychange decoration using unified attribute
  const type = (attrs["data-ychange-type"] as YChangeType) || null;
  if (!type) return null;

  const user = attrs["data-ychange-user"] || null;
  const className = attrs.class || "";

  // Parse CSS variables from style attribute
  const style = parseStyleString(attrs.style || "");

  return {
    hasYChange: true,
    type,
    user,
    className,
    style,
    dataAttrs: {
      "data-ychange-type": type,
      ...(user ? { "data-ychange-user": user } : {}),
    },
  };
}

/**
 * Default return value when no ychange decorations are present.
 */
const DEFAULT_YCHANGE_INFO: YChangeDecorationInfo = {
  hasYChange: false,
  type: null,
  user: null,
  className: "",
  style: {},
  dataAttrs: {},
};

/**
 * React hook for extracting ychange decoration info from NodeView decorations.
 *
 * React NodeViews receive decorations as a prop from ReactNodeViewRenderer.
 * This hook extracts ychange-specific info and provides class names and styles
 * to apply to the NodeViewWrapper.
 *
 * Usage:
 * ```tsx
 * function MyNodeView(props: NodeViewProps) {
 *   const { decorations } = props;
 *   const ychangeInfo = useYChangeDecorations(decorations);
 *
 *   return (
 *     <NodeViewWrapper
 *       className={ychangeInfo.className}
 *       style={ychangeInfo.style}
 *       data-ychange-user={ychangeInfo.user || undefined}
 *       data-ychange-block={ychangeInfo.hasYChange ? "true" : undefined}
 *     >
 *       {content}
 *     </NodeViewWrapper>
 *   );
 * }
 * ```
 *
 * @param decorations - The decorations array from NodeViewProps
 * @returns YChangeDecorationInfo with class names, styles, and metadata
 */
export function useYChangeDecorations(decorations?: readonly Decoration[]): YChangeDecorationInfo {
  return useMemo(() => {
    if (!decorations || decorations.length === 0) {
      return DEFAULT_YCHANGE_INFO;
    }

    // Find the first ychange decoration (there should only be one per node)
    for (const decoration of decorations) {
      const info = extractYChangeFromDecoration(decoration);
      if (info) return info;
    }

    return DEFAULT_YCHANGE_INFO;
  }, [decorations]);
}

/**
 * Non-hook version for class components or imperative usage.
 * Same functionality as useYChangeDecorations but without memoization.
 *
 * @param decorations - The decorations array
 * @returns YChangeDecorationInfo with class names, styles, and metadata
 */
export function getYChangeDecorationInfo(decorations?: readonly Decoration[]): YChangeDecorationInfo {
  if (!decorations || decorations.length === 0) {
    return DEFAULT_YCHANGE_INFO;
  }

  for (const decoration of decorations) {
    const info = extractYChangeFromDecoration(decoration);
    if (info) return info;
  }

  return DEFAULT_YCHANGE_INFO;
}

/**
 * Check if decorations contain ychange information.
 * Useful for conditional rendering or styling.
 */
export function hasYChangeDecorations(decorations?: readonly Decoration[]): boolean {
  if (!decorations || decorations.length === 0) return false;

  return decorations.some((decoration) => {
    const spec = (decoration as { spec?: { ychangeAttrs?: Record<string, string> } }).spec;
    return spec && spec.ychangeAttrs;
  });
}
