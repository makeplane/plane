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

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// plane editor constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local
import type { YChange } from "./y-change-attributes";

export const YCHANGE_DECORATIONS_KEY = new PluginKey<DecorationSet>("ychange-decorations");

type YChangeDecorationOptions = {
  /**
   * Node types that use NodeViews and should be styled via decorations.
   * These nodes bypass renderHTML so GlobalAttributes won't work for them.
   */
  nodeViewTypes: string[];
};

/**
 * Build decoration set for nodes with ychange attributes.
 * Only targets NodeView-based nodes since regular nodes use GlobalAttributes.
 *
 * Output DOM attributes (via spec.ychangeAttrs for NodeViews to apply):
 * - data-ychange-type="added|removed" - for CSS styling (unified selector)
 * - data-ychange-user="..." - for tooltip
 * - class="ychange-node ychange-node--added|removed" - for specific component styling
 * - style with --ychange-color-light/dark CSS variables
 */
function buildYChangeDecorationSet(doc: ProseMirrorNode, nodeViewTypes: string[]): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    const ychange: YChange | null | undefined = node.attrs?.ychange;
    if (!ychange || !ychange.type) return;

    // Only target NodeView-backed nodes
    if (nodeViewTypes.length && !nodeViewTypes.includes(node.type.name)) return;

    // Build class list for component-specific CSS rules
    const classes = ["ychange-node"];
    if (ychange.type === "added") classes.push("ychange-node--added");
    if (ychange.type === "removed") classes.push("ychange-node--removed");

    // Build style string with CSS variables for per-user colors
    const styleParts: string[] = [];
    if (ychange.color?.lightBg) {
      styleParts.push(`--ychange-color-light: ${ychange.color.lightBg}`);
    }
    if (ychange.color?.darkBg) {
      styleParts.push(`--ychange-color-dark: ${ychange.color.darkBg}`);
    }
    // Solid color for hatching pattern lines
    if (ychange.color?.solid) {
      styleParts.push(`--ychange-color-solid: ${ychange.color.solid}`);
    }

    // For NodeViews, store ychange data in `spec` (4th arg) instead of `attrs` (3rd arg)
    // ProseMirror auto-applies `attrs` to NodeView.dom, but we want to control which
    // inner element receives the styling (e.g., table element, not wrapper div)
    // By using `spec`, ProseMirror won't touch the DOM - NodeViews read from spec manually
    const ychangeAttrs: Record<string, string> = {
      class: classes.join(" "),
      // Primary attribute for unified CSS styling
      "data-ychange-type": ychange.type,
      // User info for tooltip
      "data-ychange-user": ychange.user || "",
      // CSS variables for per-user colors
      ...(styleParts.length > 0 ? { style: styleParts.join("; ") } : {}),
    };

    // Empty attrs (3rd arg) = ProseMirror won't apply anything to DOM
    // ychangeAttrs in spec (4th arg) = NodeViews can read and apply to inner elements
    decorations.push(Decoration.node(pos, pos + node.nodeSize, {}, { ychangeAttrs }));
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Default list of node types that use NodeViews.
 * These need decoration-based styling since GlobalAttributes won't work.
 *
 * Note: For class-based NodeViews (like TableView), call applyYChangeDecorationsToDom()
 * in the constructor and update() methods.
 *
 * For React-based NodeViews, the NodeViewWrapper automatically receives decoration
 * attributes, but we still need to apply them to the wrapper element. Use the
 * useYChangeDecorations() hook in React components to get decoration classes.
 */
const DEFAULT_NODEVIEW_TYPES = [
  // Tables (class-based NodeView)
  CORE_EXTENSIONS.TABLE,
  CORE_EXTENSIONS.TABLE_ROW,
  CORE_EXTENSIONS.TABLE_CELL,
  CORE_EXTENSIONS.TABLE_HEADER,

  // Images (React NodeView)
  CORE_EXTENSIONS.CUSTOM_IMAGE,
  CORE_EXTENSIONS.IMAGE,

  // Core block nodes with React NodeViews
  CORE_EXTENSIONS.CALLOUT,
  CORE_EXTENSIONS.CODE_BLOCK,
  CORE_EXTENSIONS.WORK_ITEM_EMBED,

  // Additional extensions with React NodeViews
  ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT,
  ADDITIONAL_EXTENSIONS.ATTACHMENT,
  ADDITIONAL_EXTENSIONS.BLOCK_MATH,
  ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED,
  ADDITIONAL_EXTENSIONS.PAGE_LINK_COMPONENT,
  ADDITIONAL_EXTENSIONS.DRAWIO,
];

/**
 * Extension that creates ProseMirror decorations for NodeView nodes with ychange attributes.
 *
 * NodeViews bypass the normal renderHTML flow, so GlobalAttributes don't work for them.
 * This plugin creates node decorations that NodeViews can read and apply to their DOM.
 *
 * Usage:
 * 1. Include this extension in the version diff editor
 * 2. In each NodeView, call applyYChangeDecorationsToDom(decorations, this.dom) in constructor and update()
 */
export const YChangeDecorations = Extension.create<YChangeDecorationOptions>({
  name: "ychangeDecorations",

  addOptions() {
    return {
      nodeViewTypes: DEFAULT_NODEVIEW_TYPES,
    };
  },

  addProseMirrorPlugins() {
    const nodeViewTypes = this.options.nodeViewTypes;

    return [
      new Plugin<DecorationSet>({
        key: YCHANGE_DECORATIONS_KEY,
        state: {
          init(_, state) {
            return buildYChangeDecorationSet(state.doc, nodeViewTypes);
          },
          apply(tr, old, _oldState, newState) {
            // Version diff editor is read-only; recompute on doc change is fine
            if (!tr.docChanged) return old;
            return buildYChangeDecorationSet(newState.doc, nodeViewTypes);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
