import { mergeAttributes } from "@tiptap/core";
import { Image as BaseImageExtension } from "@tiptap/extension-image";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { type CustomImageExtension, ECustomImageAttributeNames, type InsertImageComponentProps } from "./types";
import { DEFAULT_CUSTOM_IMAGE_ATTRIBUTES } from "./utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [CORE_EXTENSIONS.CUSTOM_IMAGE]: {
      insertImageComponent: ({ file, pos, event }: InsertImageComponentProps) => ReturnType;
    };
  }
}

export const CustomImageExtensionConfig: CustomImageExtension = BaseImageExtension.extend({
  name: CORE_EXTENSIONS.CUSTOM_IMAGE,
  group: "block",
  atom: true,

  addAttributes() {
    const attributes = {
      ...this.parent?.(),
      ...Object.values(ECustomImageAttributeNames).reduce((acc, value) => {
        acc[value] = {
          default: DEFAULT_CUSTOM_IMAGE_ATTRIBUTES[value],
        };
        return acc;
      }, {}),
    };

    return attributes;
  },

  parseHTML() {
    return [
      {
        tag: "image-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["image-component", mergeAttributes(HTMLAttributes)];
  },
});
