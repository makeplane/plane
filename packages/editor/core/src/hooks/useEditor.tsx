import { DeleteImage } from "@/types/delete-image";
import { UploadImage } from "@/types/upload-image";
import { TiptapExtensions } from "@/ui/extensions";
import { TiptapEditorProps } from "@/ui/props";
import { useEditor as useTiptapEditor } from "@tiptap/react";

interface ITiptapEditor {
  value: string;
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  editable?: boolean;
  debouncedUpdatesEnabled?: boolean;
  debouncedUpdates: ({ onChange, editor }: { onChange?: (json: any, html: string) => void; editor: any }) => void;
}

export const useEditor = ({ uploadFile, debouncedUpdates, setShouldShowAlert, deleteFile, setIsSubmitting, value, onChange, debouncedUpdatesEnabled, editable }: ITiptapEditor) => useTiptapEditor({
  editable: editable ?? true,
  editorProps: TiptapEditorProps(uploadFile, setIsSubmitting),
  extensions: TiptapExtensions(uploadFile, deleteFile, setIsSubmitting),
  content: (typeof value === "string" && value.trim() !== "") ? value : "<p></p>",
  onUpdate: async ({ editor }) => {
    // for instant feedback loop
    setIsSubmitting?.("submitting");
    setShouldShowAlert?.(true);
    if (debouncedUpdatesEnabled) {
      debouncedUpdates({ onChange, editor });
    } else {
      onChange?.(editor.getJSON(), editor.getHTML());
    }
  },
});
