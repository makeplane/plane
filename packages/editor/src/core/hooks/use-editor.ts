import { DOMSerializer } from "@tiptap/pm/model";
import { useEditorState, useEditor as useTiptapEditor } from "@tiptap/react";
import { useImperativeHandle, useEffect } from "react";
import * as Y from "yjs";
// components
import { getEditorMenuItems } from "@/components/menus";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { CoreEditorExtensions } from "@/extensions";
// helpers
import { getParagraphCount } from "@/helpers/common";
import { getEditorRefHelpers } from "@/helpers/editor-ref";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { insertContentAtSavedSelection } from "@/helpers/insert-content-at-cursor-position";
import { scrollToNodeViaDOMCoordinates } from "@/helpers/scroll-to-node";
// props
import { CoreEditorProps } from "@/props";
// types
import type { TEditorCommands, TEditorHookProps } from "@/types";

export const useEditor = (props: TEditorHookProps) => {
  const {
    autofocus = false,
    disabledExtensions,
    editable = true,
    editorClassName = "",
    editorProps = {},
    enableHistory,
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id = "",
    initialValue,
    isTouchDevice,
    mentionHandler,
    onAssetChange,
    onChange,
    onEditorFocus,
    onTransaction,
    placeholder,
    provider,
    tabIndex,
    value,
  } = props;

  const editor = useTiptapEditor(
    {
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      autofocus,
      parseOptions: { preserveWhitespace: true },
      editorProps: {
        ...CoreEditorProps({
          editorClassName,
        }),
        ...editorProps,
      },
      extensions: [
        ...CoreEditorExtensions({
          editable,
          disabledExtensions,
          enableHistory,
          fileHandler,
          flaggedExtensions,
          isTouchDevice,
          mentionHandler,
          placeholder,
          tabIndex,
        }),
        ...extensions,
      ],
      content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
      onCreate: () => handleEditorReady?.(true),
      onTransaction: () => {
        onTransaction?.();
      },
      onUpdate: ({ editor }) => onChange?.(editor.getJSON(), editor.getHTML()),
      onDestroy: () => handleEditorReady?.(false),
      onFocus: onEditorFocus,
    },
    [editable]
  );

  // Effect for syncing SWR data
  useEffect(() => {
    // value is null when intentionally passed where syncing is not yet
    // supported and value is undefined when the data from swr is not populated
    if (value == null) return;
    if (editor) {
      const isUploadInProgress = getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY)?.uploadInProgress;
      if (!editor.isDestroyed && !isUploadInProgress) {
        try {
          editor.commands.setContent(value, false, { preserveWhitespace: true });
          if (editor.state.selection) {
            const docLength = editor.state.doc.content.size;
            const relativePosition = Math.min(editor.state.selection.from, docLength - 1);
            editor.commands.setTextSelection(relativePosition);
          }
        } catch (error) {
          console.error("Error syncing editor content with external value:", error);
        }
      }
    }
  }, [editor, value, id]);

  // update assets upload status
  useEffect(() => {
    if (!editor) return;
    const assetsUploadStatus = fileHandler.assetsUploadStatus;
    editor.commands.updateAssetsUploadStatus?.(assetsUploadStatus);
  }, [editor, fileHandler.assetsUploadStatus]);

  // subscribe to assets list changes
  const assetsList = useEditorState({
    editor,
    selector: ({ editor }) => ({
      assets: editor ? getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY)?.assetsList : [],
    }),
  });
  // trigger callback when assets list changes
  useEffect(() => {
    const assets = assetsList?.assets;
    if (!assets || !onAssetChange) return;
    onAssetChange(assets);
  }, [assetsList?.assets, onAssetChange]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      ...getEditorRefHelpers({ editor, provider }),
      blur: () => editor?.commands.blur(),
      createSelectionAtCursorPosition: () => {
        if (!editor) return;
        const { empty } = editor.state.selection;

        // if (empty) return null;
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
      focus: ({ position = "start", scrollIntoView = false }) => editor?.commands.focus(position, { scrollIntoView }),
      getCordsFromPos: (pos?: number) => editor?.view.coordsAtPos(pos ?? editor.state.selection.from),
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
      isEditorReadyToDiscard: () =>
        !!editor && getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY)?.uploadInProgress === false,
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
          if (!editor) return;
          callback({
            characters: editor ? getExtensionStorage(editor, CORE_EXTENSIONS.CHARACTER_COUNT)?.characters?.() : 0,
            paragraphs: getParagraphCount(editor?.state),
            words: editor ? getExtensionStorage(editor, CORE_EXTENSIONS.CHARACTER_COUNT)?.words?.() : 0,
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
          const headings = getExtensionStorage(editor, CORE_EXTENSIONS.HEADINGS_LIST)?.headings;
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
    }),
    [editor]
  );

  if (!editor) {
    return null;
  }

  return editor;
};
