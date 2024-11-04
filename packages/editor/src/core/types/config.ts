import { DeleteImage, RestoreImage, UploadImage } from "@/types";

export type TFileHandler = {
  getAssetSrc: (path: string) => Promise<string>;
  cancel: () => void;
  delete: DeleteImage;
  upload: UploadImage;
  restore: RestoreImage;
  validation: {
    /**
     * @description max file size in bytes
     * @example enter 5242880( 5* 1024 * 1024) for 5MB
     */
    maxFileSize: number;
  };
};

export type TEditorFontStyle = "sans-serif" | "serif" | "monospace";

export type TEditorFontSize = "small-font" | "large-font";

export type TDisplayConfig = {
  fontStyle?: TEditorFontStyle;
  fontSize?: TEditorFontSize;
};
