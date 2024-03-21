import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject, useState } from "react";
import { CoreEditorProps } from "src/ui/props";
import { CoreEditorExtensions } from "src/ui/extensions";
import { EditorProps } from "@tiptap/pm/view";
import { getTrimmedHTML } from "src/lib/utils";
import { DeleteImage } from "src/types/delete-image";
import { IMentionSuggestion } from "src/types/mention-suggestion";
import { RestoreImage } from "src/types/restore-image";
import { UploadImage } from "src/types/upload-image";
import { Selection } from "@tiptap/pm/state";
import { insertContentAtSavedSelection } from "src/helpers/insert-content-at-cursor-position";
import { EditorMenuItemNames, getEditorMenuItems } from "src/ui/menus/menu-items";
import { EditorRefApi } from "src/types/editor-ref-api";
import { IMarking, scrollSummary } from "src/helpers/scroll-to-node";

interface CustomEditorProps {
  uploadFile: UploadImage;
  restoreFile: RestoreImage;
  deleteFile: DeleteImage;
  cancelUploadImage?: () => any;
  value: string;
  onStart?: (json: object, html: string) => void;
  onChange?: (json: object, html: string) => void;
  extensions?: any;
  editorProps?: EditorProps;
  forwardedRef?: MutableRefObject<EditorRefApi | null>;
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
  handleEditorReady: (value: boolean) => void;
}

export const useEditor = ({
  uploadFile,
  deleteFile,
  cancelUploadImage,
  editorProps = {},
  value,
  extensions = [],
  onStart,
  onChange,
  forwardedRef,
  restoreFile,
  handleEditorReady,
  mentionHighlights,
  mentionSuggestions,
}: CustomEditorProps) => {
  const editor = useCustomEditor({
    editorProps: {
      ...CoreEditorProps(uploadFile),
      ...editorProps,
    },
    extensions: [
      ...CoreEditorExtensions(
        {
          mentionSuggestions: mentionSuggestions ?? [],
          mentionHighlights: mentionHighlights ?? [],
        },
        deleteFile,
        restoreFile,
        cancelUploadImage
      ),
      ...extensions,
    ],
    content: typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
    onCreate: async ({ editor }) => {
      console.log("CREATED");
      handleEditorReady(true);
      onStart?.(editor.getJSON(), getTrimmedHTML(editor.getHTML()));
    },
    onTransaction: async ({ editor }) => {
      setSavedSelection(editor.state.selection);
    },
    onUpdate: async ({ editor }) => {
      // setIsSubmitting?.("submitting");
      // setShouldShowAlert?.(true);
      onChange?.(editor.getJSON(), getTrimmedHTML(editor.getHTML()));
    },
    onDestroy: async () => {
      console.log("DESTROYED 💣");
      handleEditorReady(false);
    },
  });

  const editorRef: MutableRefObject<Editor | null> = useRef(null);

  const [savedSelection, setSavedSelection] = useState<Selection | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => {
      // console.log("useEditor: Attaching methods to forwardedRef", forwardedRef);

      const a = 10;
      return {
        clearEditor: () => {
          editorRef.current?.commands.clearContent();
        },
        setEditorValue: (content: string) => {
          editorRef.current?.commands.setContent(content);
        },
        setEditorValueAtCursorPosition: (content: string) => {
          if (savedSelection) {
            insertContentAtSavedSelection(editorRef, content, savedSelection);
          }
        },
        executeMenuItemCommand: (itemName: EditorMenuItemNames) => {
          const editorItems = getEditorMenuItems(editorRef.current, uploadFile);

          const getEditorMenuItem = (itemName: EditorMenuItemNames) =>
            editorItems.find((item) => item.name === itemName);

          const item = getEditorMenuItem(itemName);
          if (item) {
            item.command();
          } else {
            console.warn(`No command found for item: ${itemName}`);
          }
        },
        isMenuItemActive: (itemName: EditorMenuItemNames): boolean => {
          const editorItems = getEditorMenuItems(editorRef.current, uploadFile);

          const getEditorMenuItem = (itemName: EditorMenuItemNames) =>
            editorItems.find((item) => item.name === itemName);
          const item = getEditorMenuItem(itemName);
          return item ? item.isActive() : false;
        },
        onStateChange: (callback: () => void) => {
          // Subscribe to editor state changes
          editorRef.current?.on("transaction", () => {
            console.log("transaction ran");
            callback();
          });
          // Return a function to unsubscribe
          return () => {
            editorRef.current?.off("transaction");
          };
        },
        getMarkDown: (): string => {
          const markdownOutput = editorRef.current?.storage.markdown.getMarkdown();
          return markdownOutput;
        },
        scrollSummary: (marking: IMarking): void => {
          if (!editorRef.current) return;
          scrollSummary(editorRef.current, marking);
        },
      };
    },
    [editorRef]
  );

  if (!editor) {
    return null;
  }

  editorRef.current = editor;
  // console.log("useEditor: Editor instance created", editor);

  return editor;
};
