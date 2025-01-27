import { HocuspocusProvider } from "@hocuspocus/provider";
import { DOMSerializer } from "@tiptap/pm/model";
import { EditorProps } from "@tiptap/pm/view";
import { useEditor as useTiptapEditor, Extensions } from "@tiptap/react";
import { useImperativeHandle, MutableRefObject, useEffect } from "react";
import * as Y from "yjs";
// components
import { getEditorMenuItems } from "@/components/menus";
// extensions
import { CoreEditorExtensions } from "@/extensions";
// helpers
import { getParagraphCount } from "@/helpers/common";
import { insertContentAtSavedSelection } from "@/helpers/insert-content-at-cursor-position";
import { IMarking, scrollSummary, scrollToNodeViaDOMCoordinates } from "@/helpers/scroll-to-node";
// props
import { CoreEditorProps } from "@/props";
// types
import type {
  TDocumentEventsServer,
  EditorRefApi,
  TEditorCommands,
  TFileHandler,
  TExtensions,
  TMentionHandler,
} from "@/types";

export interface CustomEditorProps {
  editable: boolean;
  editorClassName: string;
  editorProps?: EditorProps;
  enableHistory: boolean;
  disabledExtensions: TExtensions[];
  extensions?: Extensions;
  fileHandler: TFileHandler;
  forwardedRef?: MutableRefObject<EditorRefApi | null>;
  handleEditorReady?: (value: boolean) => void;
  id?: string;
  initialValue?: string;
  mentionHandler: TMentionHandler;
  onChange?: (json: object, html: string) => void;
  onTransaction?: () => void;
  autofocus?: boolean;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  provider?: HocuspocusProvider;
  tabIndex?: number;
  // undefined when prop is not passed, null if intentionally passed to stop
  // swr syncing
  value?: string | null | undefined;
}

export const useEditor = (props: CustomEditorProps) => {
  const {
    disabledExtensions,
    editable = true,
    editorClassName,
    editorProps = {},
    enableHistory,
    extensions = [],
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id = "",
    initialValue,
    mentionHandler,
    onChange,
    onTransaction,
    placeholder,
    tabIndex,
    value,
    provider,
    autofocus = false,
  } = props;

  const editor = useTiptapEditor(
    {
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      autofocus,
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
    },
    [editable]
  );

  // Effect for syncing SWR data
  useEffect(() => {
    // value is null when intentionally passed where syncing is not yet
    // supported and value is undefined when the data from swr is not populated
    if (value == null) return;
    if (editor && !editor.isDestroyed && !editor.storage.imageComponent.uploadInProgress) {
      try {
        editor.commands.setContent(value, false, { preserveWhitespace: "full" });
        if (editor.state.selection) {
          const docLength = editor.state.doc.content.size;
          const relativePosition = Math.min(editor.state.selection.from, docLength - 1);
          editor.commands.setTextSelection(relativePosition);
        }
      } catch (error) {
        console.error("Error syncing editor content with external value:", error);
      }
    }
  }, [editor, value, id]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      blur: () => editor.commands.blur(),
      scrollToNodeViaDOMCoordinates(behavior?: ScrollBehavior, pos?: number) {
        const resolvedPos = pos ?? editor.state.selection.from;
        if (!editor || !resolvedPos) return;
        scrollToNodeViaDOMCoordinates(editor, resolvedPos, behavior);
      },
      getCurrentCursorPosition: () => editor.state.selection.from,
      clearEditor: (emitUpdate = false) => {
        editor?.chain().setMeta("skipImageDeletion", true).clearContent(emitUpdate).run();
      },
      setEditorValue: (content: string) => {
        editor?.commands.setContent(content, false, { preserveWhitespace: "full" });
      },
      setEditorValueAtCursorPosition: (content: string) => {
        if (editor.state.selection) {
          insertContentAtSavedSelection(editor, content);
        }
      },
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
      isMenuItemActive: (props) => {
        const { itemKey } = props;
        const editorItems = getEditorMenuItems(editor);

        const getEditorMenuItem = (itemKey: TEditorCommands) => editorItems.find((item) => item.key === itemKey);
        const item = getEditorMenuItem(itemKey);
        if (!item) return false;

        return item.isActive(props);
      },
      onHeadingChange: (callback: (headings: IMarking[]) => void) => {
        // Subscribe to update event emitted from headers extension
        editor?.on("update", () => {
          callback(editor?.storage.headingList.headings);
        });
        // Return a function to unsubscribe to the continuous transactions of
        // the editor on unmounting the component that has subscribed to this
        // method
        return () => {
          editor?.off("update");
        };
      },
      getHeadings: () => editor?.storage.headingList.headings,
      onStateChange: (callback: () => void) => {
        // Subscribe to editor state changes
        editor?.on("transaction", () => {
          callback();
        });

        // Return a function to unsubscribe to the continuous transactions of
        // the editor on unmounting the component that has subscribed to this
        // method
        return () => {
          editor?.off("transaction");
        };
      },
      getMarkDown: (): string => {
        const markdownOutput = editor?.storage.markdown.getMarkdown();
        return markdownOutput;
      },
      getDocument: () => {
        const documentBinary = provider?.document ? Y.encodeStateAsUpdate(provider?.document) : null;
        const documentHTML = editor?.getHTML() ?? "<p></p>";
        const documentJSON = editor.getJSON() ?? null;

        return {
          binary: documentBinary,
          html: documentHTML,
          json: documentJSON,
        };
      },
      scrollSummary: (marking: IMarking): void => {
        if (!editor) return;
        scrollSummary(editor, marking);
      },
      isEditorReadyToDiscard: () => editor?.storage.imageComponent.uploadInProgress === false,
      setFocusAtPosition: (position: number) => {
        if (!editor || editor.isDestroyed) {
          console.error("Editor reference is not available or has been destroyed.");
          return;
        }
        try {
          const docSize = editor.state.doc.content.size;
          const safePosition = Math.max(0, Math.min(position, docSize));
          editor
            .chain()
            .insertContentAt(safePosition, [{ type: "paragraph" }])
            .focus()
            .run();
        } catch (error) {
          console.error("An error occurred while setting focus at position:", error);
        }
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
      getDocumentInfo: () => ({
        characters: editor?.storage?.characterCount?.characters?.() ?? 0,
        paragraphs: getParagraphCount(editor?.state),
        words: editor?.storage?.characterCount?.words?.() ?? 0,
      }),
      setProviderDocument: (value) => {
        const document = provider?.document;
        if (!document) return;
        Y.applyUpdate(document, value);
      },
      emitRealTimeUpdate: (message: TDocumentEventsServer) => provider?.sendStateless(message),
      listenToRealTimeUpdate: () => provider && { on: provider.on.bind(provider), off: provider.off.bind(provider) },
    }),
    [editor]
  );

  if (!editor) {
    return null;
  }

  return editor;
};
