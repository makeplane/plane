import React, { useState } from "react";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// constants
import { COLORS_LIST } from "@/constants/common";
// local components
import { CalloutBlockColorSelector } from "./color-selector";
import { CalloutBlockLogoSelector } from "./logo-selector";
// types
import { EAttributeNames, TCalloutBlockAttributes } from "./types";
// utils
import { updateStoredBackgroundColor } from "./utils";

type Props = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TCalloutBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TCalloutBlockAttributes>) => void;
};

export const CustomCalloutBlock: React.FC<Props> = (props) => {
  const { editor, node, updateAttributes } = props;
  // states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  // derived values
  const activeBackgroundColor = COLORS_LIST.find((c) => node.attrs["data-background"] === c.key)?.backgroundColor;

  return (
    <NodeViewWrapper
      className="editor-callout-component group/callout-node relative bg-custom-background-90 rounded-lg text-custom-text-100 p-4 my-2 flex items-start gap-4 transition-colors duration-500 break-words"
      style={{
        backgroundColor: activeBackgroundColor,
      }}
    >
      <CalloutBlockLogoSelector
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
            [EAttributeNames.BACKGROUND]: val,
          });
          updateStoredBackgroundColor(val);
        }}
      />
      <NodeViewContent as="div" className="w-full break-words" />
    </NodeViewWrapper>
  );
};
