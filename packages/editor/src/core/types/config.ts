// plane imports
import { TWebhookConnectionQueryParams } from "@plane/types";

export type TFileHandler = {
  assetsUploadStatus: Record<string, number>; // blockId => progress percentage
  cancel: () => void;
  checkIfAssetExists: (assetId: string) => Promise<boolean>;
  delete: (assetSrc: string) => Promise<void>;
  getAssetDownloadSrc: (path: string) => Promise<string>;
  getAssetSrc: (path: string) => Promise<string>;
  restore: (assetSrc: string) => Promise<void>;
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

export type TEditorFontSize = "small-font" | "large-font" | "mobile-font";

export type TEditorLineSpacing = "regular" | "small" | "mobile-regular";

export type TDisplayConfig = {
  fontStyle?: TEditorFontStyle;
  fontSize?: TEditorFontSize;
  lineSpacing?: TEditorLineSpacing;
  wideLayout?: boolean;
};

export type TUserDetails = {
  color: string;
  id: string;
  name: string;
  cookie?: string;
};

export type TRealtimeConfig = {
  url: string;
  queryParams: TWebhookConnectionQueryParams;
};

export type IMarking = {
  type: "heading";
  level: number;
  text: string;
  sequence: number;
};
