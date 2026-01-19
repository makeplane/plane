import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
// constants
import { COLORS_LIST } from "@/constants/common";
// local components
import { CalloutBlockColorSelector } from "./color-selector";
import { CalloutBlockLogoSelector } from "./logo-selector";
// types
import type { TCalloutBlockAttributes } from "./types";
import { ECalloutAttributeNames } from "./types";
// utils
import { updateStoredBackgroundColor } from "./utils";

export type CustomCalloutNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TCalloutBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TCalloutBlockAttributes>) => void;
};

export function CustomCalloutBlock(props: CustomCalloutNodeViewProps) {
  const { editor, node, updateAttributes } = props;
  // states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  // derived values
  const activeBackgroundColor = COLORS_LIST.find((c) => node.attrs["data-background"] === c.key)?.backgroundColor;

  return (
    <NodeViewWrapper
      key={node.attrs[ECalloutAttributeNames.ID]}
      className="editor-callout-component group/callout-node relative bg-layer-3 rounded-lg text-primary p-4 my-2 flex items-start gap-4 transition-colors duration-500 break-words"
      style={{
        backgroundColor: activeBackgroundColor,
      }}
    >
      <CalloutBlockLogoSelector
        key={node.attrs[ECalloutAttributeNames.ID]}
        blockAttributes={node.attrs}
        disabled={!editor.isEditable}
        isOpen={isEmojiPickerOpen}
        handleOpen={(val) => setIsEmojiPickerOpen(val)}
        updateAttributes={updateAttributes}
      />
      <CalloutBlockColorSelector
        disabled={!editor.isEditable}
        isOpen={isColorPickerOpen}
        toggleDropdown={() => setIsColorPickerOpen((prev) => !prev)}
        onSelect={(val) => {
          updateAttributes({
            [ECalloutAttributeNames.BACKGROUND]: val,
          });
          updateStoredBackgroundColor(val);
        }}
      />
      <NodeViewContent as="div" className="w-full break-words" />
    </NodeViewWrapper>
  );
}
