import { Editor } from "@tiptap/react";
import { UploadImage } from "../types/upload-image";
import { startImageUpload } from "../ui/plugins/upload-image";

export const toggleBold = (editor: Editor) => editor?.chain().focus().toggleBold().run();

export const toggleItalic = (editor: Editor) => editor?.chain().focus().toggleItalic().run();

export const toggleUnderline = (editor: Editor) => editor?.chain().focus().toggleUnderline().run();

export const toggleStrike = (editor: Editor) => editor?.chain().focus().toggleStrike().run();

export const toggleCode = (editor: Editor) => editor?.chain().focus().toggleCode().run();

export const toggleBulletList = (editor: Editor) => editor?.chain().focus().toggleBulletList().run();

export const toggleOrderedList = (editor: Editor) => editor?.chain().focus().toggleOrderedList().run();

export const toggleBlockquote = (editor: Editor) => editor?.chain().focus().toggleBlockquote().run();

export const insertTable = (editor: Editor) => editor?.chain().focus().insertTable().run();

export const insertImage = (editor: Editor, uploadFile: UploadImage, setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    if (input.files?.length) {
      const file = input.files[0];
      const pos = editor.view.state.selection.from;
      startImageUpload(file, editor.view, pos, uploadFile, setIsSubmitting);
    }
  };
  input.click();
};

