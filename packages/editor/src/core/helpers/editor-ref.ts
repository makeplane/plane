import type { HocuspocusProvider } from "@hocuspocus/provider";
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
import type { EditorRefApi, IEditorProps, TEditorCommands } from "@/types";
// local imports
import { getParagraphCount } from "./common";
import { insertContentAtSavedSelection } from "./insert-content-at-cursor-position";
import { scrollSummary, scrollToNodeViaDOMCoordinates } from "./scroll-to-node";

type TArgs = Pick<IEditorProps, "getEditorMetaData"> & {
  editor: Editor | null;
  provider: HocuspocusProvider | undefined;
};

export const getEditorRefHelpers = (args: TArgs): EditorRefApi => {
  const { editor, getEditorMetaData, provider } = args;

  return {
    blur: () => editor?.commands.blur(),
    clearEditor: (emitUpdate = false) => {
      editor?.chain().setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true).clearContent(emitUpdate).run();
    },
    createSelectionAtCursorPosition: () => {
      if (!editor) return;
      const { empty } = editor.state.selection;

      if (empty) {
        // Get the text content and position info
        const { $from } = editor.state.selection;
        const textContent = $from.parent.textContent;
        const posInNode = $from.parentOffset;

        // Find word boundaries
        let start = posInNode;
        let end = posInNode;

        // Move start position backwards until we hit a word boundary
        while (start > 0 && /\w/.test(textContent[start - 1])) {
          start--;
        }

        // Move end position forwards until we hit a word boundary
        while (end < textContent.length && /\w/.test(textContent[end])) {
          end++;
        }

        // If we found a word, select it using editor commands
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
      // convert to markdown
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
        // move cursor to the end of the selection and insert a new line
        editor.chain().focus().setTextSelection(to).insertContent("<br />").insertContent(contentHTML).run();
      } else {
        // replace selected text with the content provided
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

      // Subscribe to update event emitted from character count extension
      editor?.on("update", handleDocumentInfoChange);
      // Return a function to unsubscribe to the continuous transactions of
      // the editor on unmounting the component that has subscribed to this
      // method
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

      // Subscribe to update event emitted from headers extension
      editor?.on("update", handleHeadingChange);
      // Return a function to unsubscribe to the continuous transactions of
      // the editor on unmounting the component that has subscribed to this
      // method
      return () => {
        editor?.off("update", handleHeadingChange);
      };
    },
    onStateChange: (callback) => {
      // Subscribe to editor state changes
      editor?.on("transaction", callback);

      // Return a function to unsubscribe to the continuous transactions of
      // the editor on unmounting the component that has subscribed to this
      // method
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
  };
};
