export type TReadOnlyFileHandler = {
  checkIfAssetExists: (assetId: string) => Promise<boolean>;
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
  isMobile?: boolean;
};

export type TEditorFontStyle = "sans-serif" | "serif" | "monospace";

export type TEditorFontSize = "small-font" | "large-font" | "mobile-font";

export type TEditorLineSpacing = "regular" | "small" | "mobile-regular";

export type TDisplayConfig = {
  fontStyle?: TEditorFontStyle;
  fontSize?: TEditorFontSize;
  lineSpacing?: TEditorLineSpacing;
  wideLayout?: boolean;
};
