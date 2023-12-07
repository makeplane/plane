import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject } from "react";
import { CoreEditorProps } from "../props";
import { CoreEditorExtensions } from "../extensions";
import { EditorProps } from "@tiptap/pm/view";
import { getTrimmedHTML } from "../../lib/utils";
import {
  DeleteImage,
  IMentionSuggestion,
  RestoreImage,
  UploadImage,
} from "@plane/editor-types";

interface CustomEditorProps {
  uploadFile: UploadImage;
  restoreFile: RestoreImage;
  rerenderOnPropsChange?: {
    id: string;
    description_html: string;
  };
  deleteFile: DeleteImage;
  cancelUploadImage?: () => any;
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void;
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
          cancelUploadImage,
        ),
        ...extensions,
      ],
      content:
        typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
      onCreate: async ({ editor }) => {
        onStart?.(editor.getJSON(), getTrimmedHTML(editor.getHTML()));
      },
      onUpdate: async ({ editor }) => {
        // for instant feedback loop
        setIsSubmitting?.("submitting");
        setShouldShowAlert?.(true);
        onChange?.(editor.getJSON(), getTrimmedHTML(editor.getHTML()));
      },
    },
    [rerenderOnPropsChange],
  );

  const editorRef: MutableRefObject<Editor | null> = useRef(null);
  editorRef.current = editor;

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: () => {
      editorRef.current?.commands.clearContent();
    },
    setEditorValue: (content: string) => {
      editorRef.current?.commands.setContent(content);
    },
  }));

  if (!editor) {
    return null;
  }

  return editor;
};
