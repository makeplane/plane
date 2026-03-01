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

import type { Decoration } from "@tiptap/pm/view";

/**
 * Attributes that are added by ychange decorations.
 * Used to clean up old attributes before applying new ones.
 */
const YCHANGE_ATTR_NAMES = ["data-ychange-type", "data-ychange-user"];

const YCHANGE_CLASSES = ["ychange-node", "ychange-node--added", "ychange-node--removed"];

const YCHANGE_CSS_VARS = ["--ychange-color-light", "--ychange-color-dark"];

/**
 * Apply ychange decoration attributes to a NodeView's DOM element.
 *
 * NodeViews bypass ProseMirror's normal renderHTML flow, so GlobalAttributes
 * don't work for them. Instead, we use decorations to pass the ychange info,
 * and this utility applies those decoration attributes to the DOM.
 *
 * Output attributes applied to target element:
 * - data-ychange-type="added|removed" - for CSS styling
 * - data-ychange-user="..." - for tooltip
 * - class with ychange-node classes
 * - CSS variables via inline style
 *
 * Call this in both the NodeView constructor and update() method:
 *
 * ```ts
 * constructor(node, cellMinWidth, decorations, editor, getPos) {
 *   // ... create DOM ...
 *   applyYChangeDecorationsToDom(decorations, this.dom, this.table);
 * }
 *
 * update(node, decorations) {
 *   // ... update logic ...
 *   applyYChangeDecorationsToDom(decorations, this.dom, this.table);
 *   return true;
 * }
 * ```
 *
 * @param decorations - The decorations array passed to NodeView constructor/update
 * @param dom - The NodeView's outer DOM element (used to find decorations)
 * @param targetElement - Optional: The inner element to apply styles to (e.g., table, img). Defaults to dom.
 */
export function applyYChangeDecorationsToDom(
  decorations: readonly Decoration[],
  dom: HTMLElement,
  targetElement?: HTMLElement
): void {
  const target = targetElement ?? dom;

  // Helper to clean ychange attributes from an element
  const cleanElement = (el: HTMLElement) => {
    YCHANGE_ATTR_NAMES.forEach((attr) => el.removeAttribute(attr));
    YCHANGE_CLASSES.forEach((cls) => el.classList.remove(cls));
    YCHANGE_CSS_VARS.forEach((prop) => el.style.removeProperty(prop));
    el.style.removeProperty("color");
  };

  // 1. Always clean the dom element (ProseMirror applies decorations here automatically)
  cleanElement(dom);

  // 2. If targeting a different element, also clean it
  if (target !== dom) {
    cleanElement(target);
  }

  // 3. Find the node decoration from YChangeDecorations plugin
  // Decorations store ychange data in spec.ychangeAttrs (not in DOM attrs)
  // This prevents ProseMirror from auto-applying attributes to NodeView.dom
  const nodeDecorations = decorations.filter((d) => {
    const spec = (d as { spec?: { ychangeAttrs?: Record<string, string> } }).spec;
    return spec && spec.ychangeAttrs;
  });

  if (nodeDecorations.length === 0) return;

  // Use the first matching decoration (there should only be one per node)
  const deco = nodeDecorations[0];
  const attrs = (deco as { spec?: { ychangeAttrs?: Record<string, string> } }).spec?.ychangeAttrs;

  if (!attrs) return;

  // 4. Apply classes to target element
  if (attrs.class) {
    attrs.class
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => target.classList.add(c));
  }

  // 5. Apply style - CSS variables and color
  if (attrs.style) {
    const styleRules = attrs.style
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    styleRules.forEach((rule) => {
      const colonIndex = rule.indexOf(":");
      if (colonIndex === -1) return;
      const property = rule.slice(0, colonIndex).trim();
      const value = rule.slice(colonIndex + 1).trim();
      if (property && value) {
        target.style.setProperty(property, value);
      }
    });
  }

  // 6. Apply data attributes to target element
  if (attrs["data-ychange-type"]) {
    target.setAttribute("data-ychange-type", attrs["data-ychange-type"]);
  }
  if (attrs["data-ychange-user"]) {
    target.setAttribute("data-ychange-user", attrs["data-ychange-user"]);
  }
}
