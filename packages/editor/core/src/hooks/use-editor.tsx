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

interface CustomEditorProps {
  uploadFile: UploadImage;
  restoreFile: RestoreImage;
  rerenderOnPropsChange?: {
    id: string;
    description_html: string;
  };
  deleteFile: DeleteImage;
  cancelUploadImage?: () => any;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  value: string;
  debouncedUpdatesEnabled?: boolean;
  onStart?: (json: any, html: string) => void;
  onChange?: (json: any, html: string) => void;
  extensions?: any;
  editorProps?: EditorProps;
  forwardedRef?: any;
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
}

export const useEditor = ({
  uploadFile,
  deleteFile,
  cancelUploadImage,
  editorProps = {},
  value,
  rerenderOnPropsChange,
  extensions = [],
  onStart,
  onChange,
  setIsSubmitting,
  forwardedRef,
  restoreFile,
  setShouldShowAlert,
  mentionHighlights,
  mentionSuggestions,
}: CustomEditorProps) => {
  const editor = useCustomEditor(
    {
      editorProps: {
        ...CoreEditorProps(uploadFile, setIsSubmitting),
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
        setIsSubmitting?.("submitting");
        setShouldShowAlert?.(true);
        onChange?.(editor.getJSON(), getTrimmedHTML(editor.getHTML()));
      },
    },
    [rerenderOnPropsChange]
  );

  const editorRef: MutableRefObject<Editor | null> = useRef(null);
  editorRef.current = editor;

  const [savedSelection, setSavedSelection] = useState<Selection | null>(null);

  useImperativeHandle(forwardedRef, () => ({
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
  }));

  if (!editor) {
    return null;
  }

  return editor;
};
