import { ReactNodeViewRenderer } from "@tiptap/react";
// extensions
import { CustomCalloutBlock, CustomCalloutNodeViewProps } from "@/extensions/callout";
// config
import { CustomCalloutExtensionConfig } from "./extension-config";

export const CustomCalloutReadOnlyExtension = CustomCalloutExtensionConfig.extend({
  selectable: false,
  draggable: false,

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <CustomCalloutBlock {...props} node={props.node as CustomCalloutNodeViewProps["node"]} />
    ));
  },
});
