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

import type { HocuspocusProvider } from "@hocuspocus/provider";
import { findChildren } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import * as Y from "yjs";
// plane imports
import { convertHTMLToMarkdown } from "@plane/utils";
// components
import { getEditorMenuItems } from "@/components/menus";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { CORE_EDITOR_META } from "@/constants/meta";
// types
import { getExtenedEditorRefHelpers } from "@/plane-editor/helpers/extended-editor-ref";
import type { CoreEditorRefApi, EditorRefApi, IEditorProps, TEditorCommands } from "@/types";
// local imports
import { getParagraphCount } from "./common";
import { insertContentAtSavedSelection } from "./insert-content-at-cursor-position";
import { scrollSummary, scrollToNodeViaDOMCoordinates } from "./scroll-to-node";
import { parseEditorHTMLtoGlobalHTML } from "../utils/editor-html-parser";

type TArgs = Pick<IEditorProps, "getEditorMetaData"> & {
  editor: Editor | null;
  provider: HocuspocusProvider | undefined;
};

export const getEditorRefHelpers = (args: TArgs): EditorRefApi => {
  const { editor, getEditorMetaData, provider } = args;

  const coreHelpers: CoreEditorRefApi = {
    blur: () => editor?.commands.blur(),
    clearEditor: (emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true)
        .clearContent(emitUpdate)
        .run();
    },
    createSelectionAtCursorPosition: () => {
      if (!editor) return;
      const { empty } = editor.state.selection;

      if (empty) {
        const { $from } = editor.state.selection;
        const textContent = $from.parent.textContent;
        const posInNode = $from.parentOffset;

        let start = posInNode;
        let end = posInNode;

        while (start > 0 && /\w/.test(textContent[start - 1])) {
          start--;
        }

        while (end < textContent.length && /\w/.test(textContent[end])) {
          end++;
        }

        if (start !== end) {
          const from = $from.start() + start;
          const to = $from.start() + end;
          editor.commands.setTextSelection({ from, to });
        }
      }
    },
    getDocument: () => {
      const documentBinary = provider?.document ? Y.encodeStateAsUpdate(provider?.document) : null;
      const documentHTML = editor?.getHTML() ?? "<p></p>";
      const documentJSON = editor?.getJSON() ?? null;

      return {
        binary: documentBinary,
        html: documentHTML,
        json: documentJSON,
      };
    },
    getDocumentInfo: () => ({
      characters: editor?.storage.characterCount?.characters?.() ?? 0,
      paragraphs: getParagraphCount(editor?.state),
      words: editor?.storage.characterCount?.words?.() ?? 0,
    }),
    getHeadings: () => (editor ? editor.storage.headingsList?.headings : []),
    getMarkDown: () => {
      if (!editor) return "";
      const editorHTML = editor.getHTML();
      const metaData = getEditorMetaData(editorHTML);
      const markdown = convertHTMLToMarkdown({
        description_html: editorHTML,
        metaData,
      });
      return markdown;
    },
    copyMarkdownToClipboard: () => {
      if (!editor) return;

      const html = editor.getHTML();
      const metaData = getEditorMetaData(html);
      const markdown = convertHTMLToMarkdown({
        description_html: html,
        metaData,
      });

      const copyHandler = (event: ClipboardEvent) => {
        event.preventDefault();
        event.clipboardData?.setData("text/plain", markdown);
        event.clipboardData?.setData("text/html", html);
        event.clipboardData?.setData("text/plane-editor-html", html);
        document.removeEventListener("copy", copyHandler);
      };

      document.addEventListener("copy", copyHandler);
      document.execCommand("copy");
    },
    isAnyDropbarOpen: () => {
      if (!editor) return false;
      const utilityStorage = editor.storage.utility;
      return utilityStorage.activeDropbarExtensions.length > 0;
    },
    scrollSummary: (marking) => {
      if (!editor) return;
      scrollSummary(editor, marking);
    },
    setEditorValue: (content, emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true)
        .setContent(content, emitUpdate, {
          preserveWhitespace: true,
        })
        .run();
    },
    emitRealTimeUpdate: (message) => provider?.sendStateless(message),
    executeMenuItemCommand: (props) => {
      const { itemKey } = props;
      const editorItems = getEditorMenuItems(editor);
      const getEditorMenuItem = (itemKey: TEditorCommands) => editorItems.find((item) => item.key === itemKey);
      const item = getEditorMenuItem(itemKey);
      if (item) {
        item.command(props);
      } else {
        console.warn(`No command found for item: ${itemKey}`);
      }
    },
    focus: (args) => editor?.commands.focus(args),
    getCoordsFromPos: (pos) => editor?.view.coordsAtPos(pos ?? editor.state.selection.from),
    getCurrentCursorPosition: () => editor?.state.selection.from,
    getAttributesWithExtendedMark: (mark, attribute) => {
      if (!editor) return;
      editor.commands.extendMarkRange(mark);
      return editor.getAttributes(attribute);
    },
    getSelectedText: () => {
      if (!editor) return null;

      const { state } = editor;
      const { from, to, empty } = state.selection;

      if (empty) return null;

      const nodesArray: string[] = [];
      state.doc.nodesBetween(from, to, (node, _pos, parent) => {
        if (parent === state.doc && editor) {
          const serializer = DOMSerializer.fromSchema(editor.schema);
          const dom = serializer.serializeNode(node);
          const tempDiv = document.createElement("div");
          tempDiv.appendChild(dom);
          nodesArray.push(tempDiv.innerHTML);
        }
      });
      const selection = nodesArray.join("");
      return selection;
    },
    insertText: (contentHTML, insertOnNextLine) => {
      if (!editor) return;
      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      if (insertOnNextLine) {
        editor.chain().focus().setTextSelection(to).insertContent("<br />").insertContent(contentHTML).run();
      } else {
        editor.chain().focus().deleteRange({ from, to }).insertContent(contentHTML).run();
      }
    },
    isEditorReadyToDiscard: () => editor?.storage?.utility?.uploadInProgress === false,
    isMenuItemActive: (props) => {
      const { itemKey } = props;
      const editorItems = getEditorMenuItems(editor);
      const getEditorMenuItem = (itemKey: TEditorCommands) => editorItems.find((item) => item.key === itemKey);
      const item = getEditorMenuItem(itemKey);
      if (!item) return false;
      return item.isActive(props);
    },
    listenToRealTimeUpdate: () => provider && { on: provider.on.bind(provider), off: provider.off.bind(provider) },
    onDocumentInfoChange: (callback) => {
      const handleDocumentInfoChange = () => {
        if (!editor?.storage) return;
        callback({
          characters: editor.storage.characterCount?.characters?.() ?? 0,
          paragraphs: getParagraphCount(editor?.state),
          words: editor.storage.characterCount?.words?.() ?? 0,
        });
      };

      editor?.on("update", handleDocumentInfoChange);
      return () => {
        editor?.off("update", handleDocumentInfoChange);
      };
    },
    onHeadingChange: (callback) => {
      const handleHeadingChange = () => {
        if (!editor) return;
        const headings = editor.storage.headingsList?.headings;
        if (headings) {
          callback(headings);
        }
      };

      editor?.on("update", handleHeadingChange);
      return () => {
        editor?.off("update", handleHeadingChange);
      };
    },
    onStateChange: (callback) => {
      editor?.on("transaction", callback);
      return () => {
        editor?.off("transaction", callback);
      };
    },
    redo: () => editor?.commands.redo(),
    scrollToNodeViaDOMCoordinates({ pos, behavior = "smooth" }) {
      const resolvedPos = pos ?? editor?.state.selection.from;
      if (!editor || !resolvedPos) return;
      scrollToNodeViaDOMCoordinates(editor, resolvedPos, behavior);
    },
    setEditorValueAtCursorPosition: (content) => {
      if (editor?.state.selection) {
        insertContentAtSavedSelection(editor, content);
      }
    },
    setFocusAtPosition: (position) => {
      if (!editor || editor.isDestroyed) {
        console.error("Editor reference is not available or has been destroyed.");
        return;
      }
      try {
        const docSize = editor.state.doc.content.size;
        const safePosition = Math.max(0, Math.min(position, docSize));
        editor
          .chain()
          .insertContentAt(safePosition, [{ type: CORE_EXTENSIONS.PARAGRAPH }])
          .focus()
          .run();
      } catch (error) {
        console.error("An error occurred while setting focus at position:", error);
      }
    },
    setProviderDocument: (value) => {
      const document = provider?.document;
      if (!document) return;
      Y.applyUpdate(document, value);
    },
    undo: () => editor?.commands.undo(),
    editorHasSynced: () => (provider ? provider.isSynced : false),
    findAndDeleteNode: ({ attribute, value }: { attribute: string; value: string | string[] }, nodeName: string) => {
      editor
        ?.chain()
        .command(({ tr }) => {
          tr.setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true);
          tr.setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true);
          tr.setMeta(CORE_EDITOR_META.ADD_TO_HISTORY, false);

          let modified = false;
          if (Array.isArray(value)) {
            const allNodesToDelete = value.flatMap((val) =>
              findChildren(tr.doc, (node) => node.type.name === nodeName && node.attrs[attribute] === val)
            );

            if (allNodesToDelete.length > 0) {
              allNodesToDelete
                .sort((a, b) => b.pos - a.pos)
                .forEach((targetNode) => {
                  tr.delete(targetNode.pos, targetNode.pos + targetNode.node.nodeSize);
                });
              modified = true;
            }
          } else {
            const nodes = findChildren(
              tr.doc,
              (node) => node.type.name === nodeName && node.attrs[attribute] === value
            );

            if (nodes.length > 0) {
              const targetNode = nodes[0];
              tr.delete(targetNode.pos, targetNode.pos + targetNode.node.nodeSize);
              modified = true;
            }
          }

          return modified;
        })
        .run();
    },
    appendText: (textContent: string) => {
      if (!editor) return;
      try {
        const { doc } = editor.state;
        const lastNode = doc.content.lastChild;
        if (!lastNode) return false;

        const endPosition = doc.content.size - 1;
        editor
          .chain()
          .insertContentAt(endPosition, textContent)
          .focus(endPosition + textContent.length)
          .run();

        return true;
      } catch (error) {
        console.error("Error appending text to editor:", error);
        return false;
      }
    },
  };

  return { ...coreHelpers, ...getExtenedEditorRefHelpers(args) };
};
