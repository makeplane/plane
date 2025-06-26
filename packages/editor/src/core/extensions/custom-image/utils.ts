import type { Editor } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// local imports
import { ECustomImageAttributeNames, type Pixel, type TCustomImageAttributes } from "./types";

export const DEFAULT_CUSTOM_IMAGE_ATTRIBUTES: TCustomImageAttributes = {
  [ECustomImageAttributeNames.SOURCE]: null,
  [ECustomImageAttributeNames.ID]: null,
  [ECustomImageAttributeNames.WIDTH]: "35%",
  [ECustomImageAttributeNames.HEIGHT]: "auto",
  [ECustomImageAttributeNames.ASPECT_RATIO]: null,
};

export const getImageComponentImageFileMap = (editor: Editor) =>
  getExtensionStorage(editor, CORE_EXTENSIONS.CUSTOM_IMAGE)?.fileMap;

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
