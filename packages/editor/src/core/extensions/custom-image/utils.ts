import type { Editor } from "@tiptap/core";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// local imports
import { ECustomImageAttributeNames, ECustomImageStatus } from "./types";
import type { TCustomImageAlignment, Pixel, TCustomImageAttributes } from "./types";

export const DEFAULT_CUSTOM_IMAGE_ATTRIBUTES: TCustomImageAttributes = {
  [ECustomImageAttributeNames.SOURCE]: null,
  [ECustomImageAttributeNames.ID]: null,
  [ECustomImageAttributeNames.WIDTH]: "35%",
  [ECustomImageAttributeNames.HEIGHT]: "auto",
  [ECustomImageAttributeNames.ASPECT_RATIO]: null,
  [ECustomImageAttributeNames.ALIGNMENT]: "left",
  [ECustomImageAttributeNames.STATUS]: ECustomImageStatus.PENDING,
};

export const getImageComponentImageFileMap = (editor: Editor) => editor.storage.imageComponent?.fileMap;

export const ensurePixelString = <TDefault>(
  value: Pixel | TDefault | number | undefined | null,
  defaultValue?: TDefault
) => {
  if (!value || value === defaultValue) {
    return defaultValue;
  }

  if (typeof value === "number") {
    return `${value}px` satisfies Pixel;
  }

  return value;
};

export const IMAGE_ALIGNMENT_OPTIONS: {
  label: string;
  value: TCustomImageAlignment;
  icon: LucideIcon;
}[] = [
  {
    label: "Left",
    value: "left",
    icon: AlignLeft,
  },
  {
    label: "Center",
    value: "center",
    icon: AlignCenter,
  },
  {
    label: "Right",
    value: "right",
    icon: AlignRight,
  },
];
export const getImageBlockId = (id: string) => `editor-image-block-${id}`;

export const isImageDuplicating = (status: ECustomImageStatus) => status === ECustomImageStatus.DUPLICATING;

export const isImageDuplicationComplete = (status: ECustomImageStatus) =>
  status === ECustomImageStatus.UPLOADED || status === ECustomImageStatus.DUPLICATION_FAILED;

export const hasImageDuplicationFailed = (status: ECustomImageStatus) =>
  status === ECustomImageStatus.DUPLICATION_FAILED;
