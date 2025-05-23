export type TReadOnlyFileHandler = {
  getAssetSrc: (path: string) => Promise<string>;
  restore: (assetSrc: string) => Promise<void>;
};

export type TFileHandler = TReadOnlyFileHandler & {
  assetsUploadStatus: Record<string, number>; // blockId => progress percentage
  cancel: () => void;
  delete: (assetSrc: string) => Promise<void>;
  upload: (blockId: string, file: File) => Promise<string>;
  validation: {
    /**
     * @description max file size in bytes
     * @example enter 5242880(5 * 1024 * 1024) for 5MB
     */
    maxFileSize: number;
  };
};

export type TEditorFontStyle = "sans-serif" | "serif" | "monospace";

export type TEditorFontSize = "small-font" | "large-font";

export type TEditorLineSpacing = "regular" | "small";

export type TDisplayConfig = {
  fontStyle?: TEditorFontStyle;
  fontSize?: TEditorFontSize;
  lineSpacing?: TEditorLineSpacing;
  wideLayout?: boolean;
};
