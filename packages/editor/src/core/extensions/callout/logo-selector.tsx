// plane imports
import { EmojiPicker, EmojiIconPickerTypes } from "@plane/propel/emoji-icon-picker";
import { TLogoProps } from "@plane/types";
import { Logo } from "@plane/ui";
import { cn } from "@plane/utils";
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
        iconType="lucide"
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
          let newLogoValueToStoreInLocalStorage: TLogoProps = {
            in_use: "emoji",
            emoji: {
              value: DEFAULT_CALLOUT_BLOCK_ATTRIBUTES["data-emoji-unicode"],
            },
          };
          if (val.type === "emoji") {
            newLogoValue = {
              "data-emoji-unicode": val.value,
            };
            newLogoValueToStoreInLocalStorage = {
              in_use: "emoji",
              emoji: {
                value: val.value,
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
