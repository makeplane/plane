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
  });

  const editorRef: MutableRefObject<Editor | null> = useRef(null);
  editorRef.current = editor;

  const [savedSelection, setSavedSelection] = useState<Selection | null>(null);

  useImperativeHandle(forwardedRef, () => {
    const editorItems = getEditorMenuItems(editorRef.current!, uploadFile);

    const getEditorMenuItem = (itemName: EditorMenuItemNames) => editorItems.find((item) => item.name === itemName);

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
        const item = getEditorMenuItem(itemName);
        if (item) {
          item.command();
        } else {
          console.warn(`No command found for item: ${itemName}`);
        }
      },
      isMenuItemActive: (itemName: EditorMenuItemNames): boolean => {
        const item = getEditorMenuItem(itemName);
        return item ? item.isActive() : false;
      },
      getMarkDown: (): string => {
        const markdownOutput = editorRef.current?.storage.markdown.getMarkdown();
        return markdownOutput;
      },
    };
  });

  if (!editor) {
    return null;
  }

  return editor;
};
