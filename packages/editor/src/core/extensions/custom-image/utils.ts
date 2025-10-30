import type { Editor } from "@tiptap/core";
import { AlignCenter, AlignLeft, AlignRight, type LucideIcon } from "lucide-react";
// local imports
import { ECustomImageAttributeNames, TCustomImageAlignment, type Pixel, type TCustomImageAttributes } from "./types";

export const DEFAULT_CUSTOM_IMAGE_ATTRIBUTES: TCustomImageAttributes = {
  [ECustomImageAttributeNames.SOURCE]: null,
  [ECustomImageAttributeNames.ID]: null,
  [ECustomImageAttributeNames.WIDTH]: "35%",
  [ECustomImageAttributeNames.HEIGHT]: "auto",
  [ECustomImageAttributeNames.ASPECT_RATIO]: null,
  [ECustomImageAttributeNames.ALIGNMENT]: "left",
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
