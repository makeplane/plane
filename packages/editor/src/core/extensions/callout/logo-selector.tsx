// plane helpers
import { convertHexEmojiToDecimal } from "@plane/utils";
// plane ui
import { EmojiIconPicker, EmojiIconPickerTypes, Logo, TEmojiLogoProps } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common";
// types
import { TCalloutBlockAttributes } from "./types";
// utils
import { DEFAULT_CALLOUT_BLOCK_ATTRIBUTES, updateStoredLogo } from "./utils";

type Props = {
  blockAttributes: TCalloutBlockAttributes;
  disabled: boolean;
  handleOpen: (val: boolean) => void;
  isOpen: boolean;
  updateAttributes: (attrs: Partial<TCalloutBlockAttributes>) => void;
};

export const CalloutBlockLogoSelector: React.FC<Props> = (props) => {
  const { blockAttributes, disabled, handleOpen, isOpen, updateAttributes } = props;

  const logoValue: TEmojiLogoProps = {
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
      <EmojiIconPicker
        closeOnSelect={false}
        isOpen={isOpen}
        handleToggle={handleOpen}
        className="flex-shrink-0 grid place-items-center"
        buttonClassName={cn("flex-shrink-0 size-8 grid place-items-center rounded-lg", {
          "hover:bg-white/10": !disabled,
        })}
        label={<Logo logo={logoValue} size={18} type="lucide" />}
        onChange={(val) => {
          // construct the new logo value based on the type of value
          let newLogoValue: Partial<TCalloutBlockAttributes> = {};
          let newLogoValueToStoreInLocalStorage: TEmojiLogoProps = {
            in_use: "emoji",
            emoji: {
              value: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-unicode"],
              url: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-url"],
            },
          };
          if (val.type === "emoji") {
            newLogoValue = {
              "data-emoji-unicode": convertHexEmojiToDecimal(val.value.unified),
              "data-emoji-url": val.value.imageUrl,
            };
            newLogoValueToStoreInLocalStorage = {
              in_use: "emoji",
              emoji: {
                value: convertHexEmojiToDecimal(val.value.unified),
                url: val.value.imageUrl,
              },
            };
          } else if (val.type === "icon") {
            newLogoValue = {
              "data-icon-name": val.value.name,
              "data-icon-color": val.value.color,
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
};
