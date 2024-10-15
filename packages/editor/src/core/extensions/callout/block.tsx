import React, { useState } from "react";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// plane helpers
import { convertHexEmojiToDecimal } from "@plane/helpers";
// plane ui
import { EmojiIconPicker, EmojiIconPickerTypes, Logo, TEmojiLogoProps } from "@plane/ui";
// constants
import { COLORS_LIST } from "@/constants/common";
// helpers
import { cn } from "@/helpers/common";
// local components
import { CalloutBlockColorSelector } from "./color-selector";
// types
import { TCalloutBlockAttributes } from "./types";
// utils
import { DEFAULT_CALLOUT_BLOCK_ATTRIBUTES, updateStoredBackgroundColor, updateStoredLogo } from "./utils";

type Props = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TCalloutBlockAttributes;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAttributes: (attrs: Record<string, any>) => void;
};

export const CustomCalloutBlock: React.FC<Props> = (props) => {
  const { node, updateAttributes } = props;
  // states
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  // derived values
  const { dataLogoInUse, dataIconColor, dataIconName, dataEmoji, dataBackground } = node.attrs;
  const logoValue: TEmojiLogoProps = {
    in_use: dataLogoInUse,
    icon: {
      color: dataIconColor,
      name: dataIconName,
    },
    emoji: {
      value: dataEmoji,
    },
  };

  const activeBackgroundColor = COLORS_LIST.find((c) => dataBackground === c.key)?.backgroundColor;

  return (
    <NodeViewWrapper
      className="editor-callout-component group/callout-node relative bg-custom-background-90 rounded-lg text-custom-text-100 p-4 my-2 flex items-start gap-4 transition-colors duration-500"
      style={{
        backgroundColor: activeBackgroundColor,
      }}
    >
      <div contentEditable={false}>
        <EmojiIconPicker
          closeOnSelect={false}
          isOpen={isEmojiPickerOpen}
          handleToggle={(val) => setIsEmojiPickerOpen(val)}
          className="flex-shrink-0 grid place-items-center"
          buttonClassName="flex-shrink-0 size-[32px] grid place-items-center rounded-lg hover:bg-white/10"
          label={<Logo logo={logoValue} size={18} type="lucide" />}
          onChange={(val) => {
            // construct the new logo value based on the type of value
            let newLogoValue: Partial<TCalloutBlockAttributes> = {};
            let newLogoValueToStoreInLocalStorage: TEmojiLogoProps = {
              in_use: "emoji",
              emoji: {
                value: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES.dataEmoji,
              },
            };
            if (val.type === "emoji") {
              newLogoValue = {
                dataEmoji: convertHexEmojiToDecimal(val.value.unified),
              };
              newLogoValueToStoreInLocalStorage = {
                in_use: "emoji",
                emoji: {
                  value: convertHexEmojiToDecimal(val.value.unified),
                },
              };
            } else if (val.type === "icon") {
              newLogoValue = {
                dataIconName: val.value.name,
                dataIconColor: val.value.color,
              };
              newLogoValueToStoreInLocalStorage = {
                in_use: "icon",
                icon: {
                  name: val.value.name,
                  color: val.value.color,
                },
              };
            }
            // update node attributes
            updateAttributes({
              dataLogoInUse: val.type,
              ...newLogoValue,
            });
            // update stored logo in local storage
            updateStoredLogo(newLogoValueToStoreInLocalStorage);
            setIsEmojiPickerOpen(false);
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          defaultIconColor={logoValue?.in_use && logoValue.in_use === "icon" ? logoValue?.icon?.color : undefined}
          defaultOpen={
            logoValue?.in_use && logoValue.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
          }
        />
      </div>
      <div
        className={cn(
          "opacity-0 pointer-events-none group-hover/callout-node:opacity-100 group-hover/callout-node:pointer-events-auto absolute top-2 right-2 z-10 transition-opacity",
          {
            "opacity-100 pointer-events-auto": isColorPickerOpen,
          }
        )}
        contentEditable={false}
      >
        <CalloutBlockColorSelector
          isOpen={isColorPickerOpen}
          toggleDropdown={() => setIsColorPickerOpen((prev) => !prev)}
          onSelect={(val) => {
            updateAttributes({
              dataBackground: val,
            });
            updateStoredBackgroundColor(val);
          }}
        />
      </div>
      <NodeViewContent as="div" className="flex-shrink-0 whitespace-pre-wrap" />
    </NodeViewWrapper>
  );
};
