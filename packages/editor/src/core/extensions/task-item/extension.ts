/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import TaskItem from "@tiptap/extension-task-item";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { isTaskItemCollapsed, updateStoredTaskItemCollapsedState } from "./utils";

const chevronRightIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>';

// a to-do item can only be folded when it actually nests a sub-list, which is
// the shape `nested: true` produces for indented items
const hasNestedTaskList = (node: ProseMirrorNode): boolean => {
  let isNested = false;

  node.forEach((child) => {
    if (child.type.name === CORE_EXTENSIONS.TASK_LIST) {
      isNested = true;
    }
  });

  return isNested;
};

/**
 * Adds outline style folding to to-do items. The collapsed state is deliberately
 * kept out of the document- it is stored per viewer in local storage and applied
 * through DOM attributes, so folding never edits the page, never syncs to
 * collaborators and never reaches markdown, exports or version history.
 */
export const CustomTaskItemExtension = TaskItem.extend({
  addNodeView() {
    const parentNodeView = this.parent?.();

    return (props) => {
      const nodeView = parentNodeView?.(props);

      // upstream always ships a node view for task items; if that ever stops
      // being true, render a plain item rather than dropping its content
      if (!nodeView) {
        const fallbackListItem = document.createElement("li");
        const fallbackContent = document.createElement("div");
        fallbackListItem.append(fallbackContent);

        return {
          dom: fallbackListItem,
          contentDOM: fallbackContent,
        };
      }

      const listItem = nodeView.dom;

      // without the upstream markup there is no checkbox to sit a toggle beside,
      // so leave the item exactly as it was rendered
      if (!(listItem instanceof HTMLElement)) {
        return nodeView;
      }

      const { editor, getPos } = props;
      let node = props.node;
      let isCollapsed = hasNestedTaskList(node) && isTaskItemCollapsed(node.attrs.id);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.contentEditable = "false";
      toggle.tabIndex = -1;
      toggle.classList.value = "task-item-collapse-toggle";
      toggle.innerHTML = chevronRightIcon;

      const syncDOM = () => {
        const hasSubTasks = hasNestedTaskList(node);
        // an item that lost its sub-items has nothing left to hide
        if (!hasSubTasks) {
          isCollapsed = false;
        }
        listItem.dataset.hasSubTasks = String(hasSubTasks);
        listItem.dataset.collapsed = String(isCollapsed);
        toggle.setAttribute("aria-expanded", String(!isCollapsed));
        toggle.setAttribute("aria-label", isCollapsed ? "Expand sub-tasks" : "Collapse sub-tasks");
      };

      // the cursor must not be left inside sub-items that are about to be
      // hidden, so it is pulled back onto the item's own text
      const moveSelectionOutOfHiddenSubTasks = () => {
        if (!editor.isEditable || typeof getPos !== "function") return;

        try {
          const position = getPos();
          if (typeof position !== "number") return;

          const currentNode = editor.state.doc.nodeAt(position);
          const firstChild = currentNode?.firstChild;
          if (!currentNode || !firstChild) return;

          const ownTextEnd = position + 1 + firstChild.nodeSize - 1;
          const { from } = editor.state.selection;

          if (from > ownTextEnd && from < position + currentNode.nodeSize) {
            editor.commands.setTextSelection(ownTextEnd);
          }
        } catch (error) {
          console.error("Error moving selection out of collapsed to-do sub-tasks", error);
        }
      };

      const setCollapsed = (value: boolean) => {
        if (!hasNestedTaskList(node)) return;
        isCollapsed = value;
        if (isCollapsed) {
          moveSelectionOutOfHiddenSubTasks();
        }
        updateStoredTaskItemCollapsedState(node.attrs.id, isCollapsed);
        syncDOM();
      };

      // keep the editor selection where it is when the toggle is pressed
      toggle.addEventListener("mousedown", (event) => event.preventDefault());
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCollapsed(!isCollapsed);
      });

      listItem.prepend(toggle);
      syncDOM();

      return {
        ...nodeView,
        update: (updatedNode, decorations, innerDecorations) => {
          if (updatedNode.type !== node.type) {
            return false;
          }

          const isHandled = nodeView.update?.(updatedNode, decorations, innerDecorations) ?? true;
          if (!isHandled) {
            return false;
          }

          node = updatedNode;
          syncDOM();

          return true;
        },
      };
    };
  },
});
