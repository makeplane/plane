import { DeleteImage, RestoreImage, UploadImage } from "@/types";

export type TFileHandler = {
  cancel: () => void;
  delete: DeleteImage;
  upload: UploadImage;
  restore: RestoreImage;
};

export type TEditorFontStyle = "sans-serif" | "serif" | "monospace";

export type TEditorFontSize = "small-font" | "large-font";

export type TDisplayConfig = {
  fontStyle?: TEditorFontStyle;
  fontSize?: TEditorFontSize;
};
