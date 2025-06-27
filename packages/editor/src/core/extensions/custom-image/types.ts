import type { Node } from "@tiptap/core";
// types
import type { TFileHandler } from "@/types";

export enum ECustomImageAttributeNames {
  ID = "id",
  WIDTH = "width",
  HEIGHT = "height",
  ASPECT_RATIO = "aspectRatio",
  SOURCE = "src",
}

export type Pixel = `${number}px`;

export type PixelAttribute<TDefault> = Pixel | TDefault;

export type TCustomImageSize = {
  width: PixelAttribute<"35%">;
  height: PixelAttribute<"auto">;
  aspectRatio: number | null;
};

export type TCustomImageAttributes = {
  [ECustomImageAttributeNames.ID]: string | null;
  [ECustomImageAttributeNames.WIDTH]: PixelAttribute<"35%" | number> | null;
  [ECustomImageAttributeNames.HEIGHT]: PixelAttribute<"auto" | number> | null;
  [ECustomImageAttributeNames.ASPECT_RATIO]: number | null;
  [ECustomImageAttributeNames.SOURCE]: string | null;
};

export type UploadEntity = ({ event: "insert" } | { event: "drop"; file: File }) & { hasOpenedFileInputOnce?: boolean };

export type InsertImageComponentProps = {
  file?: File;
  pos?: number;
  event: "insert" | "drop";
};

export type CustomImageExtensionOptions = {
  getImageSource: TFileHandler["getAssetSrc"];
  restoreImage: TFileHandler["restore"];
  uploadImage?: TFileHandler["upload"];
};

export type CustomImageExtensionStorage = {
  fileMap: Map<string, UploadEntity>;
  deletedImageSet: Map<string, boolean>;
  maxFileSize: number;
};

export type CustomImageExtension = Node<CustomImageExtensionOptions, CustomImageExtensionStorage>;
