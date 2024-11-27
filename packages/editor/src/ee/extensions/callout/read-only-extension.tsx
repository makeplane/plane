import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { CustomCalloutBlock } from "./block";
// config
import { CustomCalloutExtensionConfig } from "./extension-config";

export const CustomCalloutReadOnlyExtension = CustomCalloutExtensionConfig.extend({
  selectable: false,
  draggable: false,

  addNodeView() {
    return ReactNodeViewRenderer(CustomCalloutBlock);
  },
});
