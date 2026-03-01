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

import type { Editor, NodeViewProps } from "@tiptap/core";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import { TableMap, updateColumnsOnResize } from "@tiptap/pm/tables";
import type { Decoration, NodeView } from "@tiptap/pm/view";
import { h } from "jsx-dom-cjs";
// version diff support
import { applyYChangeDecorationsToDom } from "@/components/editors/version-diff/extensions/ychange-nodeview-utils";

export class TableView implements NodeView {
  node: ProseMirrorNode;
  cellMinWidth: number;
  decorations: readonly Decoration[];
  editor: Editor;
  getPos: NodeViewProps["getPos"];
  hoveredCell: ResolvedPos | null = null;
  map: TableMap;
  root: HTMLElement;
  table: HTMLTableElement;
  colgroup: HTMLTableColElement;
  tbody: HTMLElement;
  controls?: HTMLElement;

  get dom() {
    return this.root;
  }

  get contentDOM() {
    return this.tbody;
  }

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    decorations: readonly Decoration[],
    editor: Editor,
    getPos: NodeViewProps["getPos"]
  ) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;
    this.decorations = decorations;
    this.editor = editor;
    this.getPos = getPos;
    this.hoveredCell = null;
    this.map = TableMap.get(node);

    this.colgroup = h(
      "colgroup",
      null,
      Array.from({ length: this.map.width }, () => 1).map(() => h("col"))
    );
    this.tbody = h("tbody");
    this.table = h("table", null, this.colgroup, this.tbody);

    this.root = h(
      "div",
      {
        className: "table-wrapper editor-full-width-block horizontal-scrollbar scrollbar-sm",
      },
      this.table
    );

    this.render();

    // Apply ychange decorations to the table element (not wrapper) for version diff highlighting
    applyYChangeDecorationsToDom(decorations, this.root, this.table);
  }

  update(node: ProseMirrorNode, decorations: readonly Decoration[]) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.decorations = [...decorations];
    this.map = TableMap.get(this.node);

    this.render();

    // Apply ychange decorations to the table element (not wrapper) for version diff highlighting
    applyYChangeDecorationsToDom(decorations, this.root, this.table);

    return true;
  }

  render() {
    if (this.colgroup.children.length !== this.map.width) {
      const cols = Array.from({ length: this.map.width }, () => 1).map(() => h("col"));
      this.colgroup.replaceChildren(...cols);
    }

    updateColumnsOnResize(this.node, this.colgroup, this.table, this.cellMinWidth);
  }

  ignoreMutation() {
    return true;
  }
}
