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

import { CORE_EXTENSIONS } from "@plane/editor";
import type { TipTapNode, NodeRendererRegistry, WalkerState } from "./types";

export type WalkOptions<TOut, TCtx> = {
  renderers: NodeRendererRegistry<TOut, TCtx>;
  ctx: TCtx;
  fallback: (node: TipTapNode, children: TOut[], ctx: TCtx) => TOut[];
};

export function walkTipTapNode<TOut, TCtx>(
  node: TipTapNode,
  state: WalkerState,
  options: WalkOptions<TOut, TCtx>
): TOut[] {
  const { renderers, ctx, fallback } = options;
  const nodeType = node.type;
  const isListContainer =
    nodeType === (CORE_EXTENSIONS.BULLET_LIST as string) ||
    nodeType === (CORE_EXTENSIONS.ORDERED_LIST as string) ||
    nodeType === (CORE_EXTENSIONS.TASK_LIST as string);

  // Compute inherited text alignment
  let childTextAlign = state.textAlign;
  if (nodeType === (CORE_EXTENSIONS.PARAGRAPH as string) && node.attrs?.textAlign) {
    childTextAlign = node.attrs.textAlign as string;
  }

  // Augment node with derived context attrs (same pattern as PDF's renderNodeWithContext)
  const nodeWithContext: TipTapNode = {
    ...node,
    attrs: {
      ...node.attrs,
      _parentType: state.parentType,
      _nestingLevel: state.nestingLevel,
      _listItemIndex: state.listItemIndex,
      _textAlign: childTextAlign,
      _isHeader: node.content?.some((child) => child.type === (CORE_EXTENSIONS.TABLE_HEADER as string)),
    },
  };

  // Compute child nesting level
  let childNestingLevel = state.nestingLevel;
  if (
    isListContainer &&
    (state.parentType === (CORE_EXTENSIONS.LIST_ITEM as string) ||
      state.parentType === (CORE_EXTENSIONS.TASK_ITEM as string))
  ) {
    childNestingLevel = state.nestingLevel + 1;
  }

  // Walk children
  let currentListItemIndex = 0;
  const childOutputs: TOut[] = [];

  if (node.content) {
    for (const child of node.content) {
      const childState: WalkerState = {
        parentType: node.type,
        nestingLevel: childNestingLevel,
        listItemIndex: 0,
        textAlign: childTextAlign,
      };

      if (isListContainer && child.type === (CORE_EXTENSIONS.LIST_ITEM as string)) {
        currentListItemIndex++;
        childState.listItemIndex = currentListItemIndex;
      }

      const childResult = walkTipTapNode(child, childState, options);
      childOutputs.push(...childResult);
    }
  }

  // Dispatch to format-specific renderer
  const renderer = renderers[node.type];
  if (renderer) {
    return renderer(nodeWithContext, childOutputs, ctx);
  }

  // Fallback: if we have children, wrap them; otherwise return empty
  return fallback(nodeWithContext, childOutputs, ctx);
}

// Convenience entry point for walking a full document
export function walkTipTapDocument<TOut, TCtx>(doc: TipTapNode, options: WalkOptions<TOut, TCtx>): TOut[] {
  return walkTipTapNode(doc, { nestingLevel: 0, listItemIndex: 0 }, options);
}
