import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import {
  useImperativeHandle,
  useRef,
  MutableRefObject,
  useEffect,
  useState,
} from "react";
import { DeleteImage } from "../../types/delete-image";
import { CoreEditorProps } from "../props";
import { CoreEditorExtensions } from "../extensions";
import { EditorProps } from "@tiptap/pm/view";
import { getTrimmedHTML } from "../../lib/utils";
import { UploadImage } from "../../types/upload-image";

interface CustomEditorProps {
  uploadFile: UploadImage;
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  value: string;
  deleteFile: DeleteImage;
  debouncedUpdatesEnabled?: boolean;
  onChange?: (json: any, html: string) => void;
  extensions?: any;
  editorProps?: EditorProps;
  forwardedRef?: any;
}

export const useEditor = ({
  uploadFile,
  deleteFile,
  editorProps = {},
  value,
  extensions = [],
  onChange,
  setIsSubmitting,
  forwardedRef,
  setShouldShowAlert,
}: CustomEditorProps) => {
  const [internalEditorContent, setInternalEditorContent] = useState(value);
  const editor = useCustomEditor(
    {
      editorProps: {
        ...CoreEditorProps(uploadFile, setIsSubmitting),
        ...editorProps,
      },
      extensions: [...CoreEditorExtensions(deleteFile), ...extensions],
      content:
        typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
      onUpdate: async ({ editor }) => {
        // for instant feedback loop
        setIsSubmitting?.("submitting");
        setShouldShowAlert?.(true);
        onChange?.(editor.getJSON(), getTrimmedHTML(editor.getHTML()));
      },
    },
    [internalEditorContent],
  );

  const hasIntiliazedContent = useRef(false);

  useEffect(() => {
    if (editor) {
      const cleanedValue =
        typeof value === "string" && value.trim() !== "" ? value : "<p></p>";
      if (cleanedValue !== "<p></p>" && !hasIntiliazedContent.current) {
        setInternalEditorContent(cleanedValue);
        hasIntiliazedContent.current = true;
      } else if (cleanedValue === "<p></p>" && hasIntiliazedContent.current) {
        hasIntiliazedContent.current = false;
      }
    }
  }, [value, editor]);

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
