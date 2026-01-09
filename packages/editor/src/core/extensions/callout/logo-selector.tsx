// plane imports
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { cn } from "@plane/utils";
// types
import type { TCalloutBlockAttributes } from "./types";
// utils
import { DEFAULT_CALLOUT_BLOCK_ATTRIBUTES, updateStoredLogo } from "./utils";

type Props = {
  blockAttributes: TCalloutBlockAttributes;
  disabled: boolean;
  handleOpen: (val: boolean) => void;
  isOpen: boolean;
  updateAttributes: (attrs: Partial<TCalloutBlockAttributes>) => void;
};

export function CalloutBlockLogoSelector(props: Props) {
  const { blockAttributes, disabled, handleOpen, isOpen, updateAttributes } = props;

  const logoValue: TLogoProps = {
    in_use: blockAttributes["data-logo-in-use"],
    icon: {
      color: blockAttributes["data-icon-color"],
      name: blockAttributes["data-icon-name"],
    },
    emoji: {
      value: blockAttributes["data-emoji-unicode"]?.toString(),
      url: blockAttributes["data-emoji-url"],
    },
  };

  return (
    <div contentEditable={false}>
      <EmojiPicker
        closeOnSelect={true}
        isOpen={isOpen}
        handleToggle={handleOpen}
        className="flex-shrink-0 grid place-items-center"
        buttonClassName={cn("flex-shrink-0 size-8 grid place-items-center rounded-lg text-primary", {
          "hover:bg-layer-1-hover": !disabled,
        })}
        label={<Logo logo={logoValue} size={18} type="lucide" />}
        onChange={(val) => {
          // construct the new logo value based on the type of value
          let newLogoValue: Partial<TCalloutBlockAttributes> = {};
          let newLogoValueToStoreInLocalStorage: TLogoProps = {
            in_use: "emoji",
            emoji: {
              value: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-unicode"],
              url: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-url"],
            },
          };
          if (val.type === "emoji") {
            // val.value is now a string in decimal format (e.g. "128512")
            const emojiValue = val.value;
            newLogoValue = {
              "data-emoji-unicode": emojiValue,
              "data-emoji-url": undefined,
            };
            newLogoValueToStoreInLocalStorage = {
              in_use: "emoji",
              emoji: {
                value: emojiValue,
                url: undefined,
              },
            };
          } else if (val.type === "icon") {
            const iconValue = val.value as { name: string; color: string };
            newLogoValue = {
              "data-icon-name": iconValue.name,
              "data-icon-color": iconValue.color,
            };
            newLogoValueToStoreInLocalStorage = {
              in_use: "icon",
              icon: {
                name: iconValue.name,
                color: iconValue.color,
              },
            };
          }
          // update node attributes
          updateAttributes({
            "data-logo-in-use": val.type,
            ...newLogoValue,
          });
          // update stored logo in local storage
          updateStoredLogo(newLogoValueToStoreInLocalStorage);
          handleOpen(false);
        }}
        defaultIconColor={logoValue?.in_use && logoValue.in_use === "icon" ? logoValue?.icon?.color : undefined}
        defaultOpen={logoValue.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON}
        disabled={disabled}
        searchDisabled
      />
    </div>
  );
}
