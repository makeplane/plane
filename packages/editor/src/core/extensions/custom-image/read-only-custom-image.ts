import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { CustomImageExtensionConfig, CustomImageNode } from "@/extensions/custom-image";
// types
import { TReadOnlyFileHandler } from "@/types";

export const CustomReadOnlyImageExtension = (props: TReadOnlyFileHandler) =>
  CustomImageExtensionConfig({
    ...props,
    validation: {
      maxFileSize: 5 * 1024 * 1024,
    },
  }).extend({
    selectable: false,
    draggable: false,

    addNodeView() {
      return ReactNodeViewRenderer(CustomImageNode);
    },
  });
