import { useMemo, useCallback } from "react";
import { Tabs } from "@base-ui-components/react";
import { Popover } from "../popover";
import { cn } from "../utils/classname";
import { convertPlacementToSideAndAlign } from "../utils/placement";
import { EmojiRoot } from "./emoji/emoji";
import { emojiToString, TCustomEmojiPicker, EmojiIconPickerTypes } from "./helper";
import { IconRoot } from "./icon/icon-root";

export const EmojiPicker: React.FC<TCustomEmojiPicker> = (props) => {
  const {
    isOpen,
    handleToggle,
    buttonClassName,
    closeOnSelect = true,
    defaultIconColor = "#6d7b8a",
    defaultOpen = EmojiIconPickerTypes.EMOJI,
    disabled = false,
    dropdownClassName,
    label,
    onChange,
    placement = "bottom-start",
    searchDisabled = false,
    searchPlaceholder = "Search",
    iconType = "lucide",
    side = "bottom",
    align = "start",
  } = props;

  // side and align calculations
  const { finalSide, finalAlign } = useMemo(() => {
    if (placement) {
      const converted = convertPlacementToSideAndAlign(placement);
      return { finalSide: converted.side, finalAlign: converted.align };
    }
    return { finalSide: side, finalAlign: align };
  }, [placement, side, align]);

  const handleEmojiChange = useCallback(
    (value: string) => {
      onChange({
        type: EmojiIconPickerTypes.EMOJI,
        value: emojiToString(value),
      });
      if (closeOnSelect) handleToggle(false);
    },
    [onChange, closeOnSelect, handleToggle]
  );

  const handleIconChange = useCallback(
    (value: { name: string; color: string }) => {
      onChange({
        type: EmojiIconPickerTypes.ICON,
        value: value,
      });
      if (closeOnSelect) handleToggle(false);
    },
    [onChange, closeOnSelect, handleToggle]
  );

  const tabs = useMemo(
    () =>
      [
        {
          key: "emoji",
          label: "Emoji",
          content: (
            <EmojiRoot
              onChange={handleEmojiChange}
              searchPlaceholder={searchPlaceholder}
              searchDisabled={searchDisabled}
            />
          ),
        },
        {
          key: "icon",
          label: "Icon",
          content: (
            <IconRoot
              defaultColor={defaultIconColor}
              onChange={handleIconChange}
              searchDisabled={searchDisabled}
              iconType={iconType}
            />
          ),
        },
      ].map((tab) => ({
        key: tab.key,
        label: tab.label,
        content: tab.content,
      })),
    [defaultIconColor, searchDisabled, searchPlaceholder, iconType, handleEmojiChange, handleIconChange]
  );

  return (
    <Popover open={isOpen} onOpenChange={handleToggle}>
      <Popover.Button className={cn("outline-none", buttonClassName)} disabled={disabled}>
        {label}
      </Popover.Button>
      <Popover.Panel
        positionerClassName="z-50"
        className={cn(
          "w-80 bg-custom-background-100 rounded-md border-[0.5px] border-custom-border-300 overflow-hidden",
          dropdownClassName
        )}
        side={finalSide}
        align={finalAlign}
        sideOffset={8}
      >
        <Tabs.Root defaultValue={defaultOpen}>
          <Tabs.List className="grid grid-cols-2 gap-1 px-3.5 pt-3">
            {tabs.map((tab) => (
              <Tabs.Tab
                key={tab.key}
                value={tab.key}
                className={({ selected }) =>
                  cn("py-1 text-sm rounded border border-custom-border-200 bg-custom-background-80", {
                    "bg-custom-background-100 text-custom-text-100": selected,
                    "text-custom-text-400 hover:text-custom-text-300 hover:bg-custom-background-80/60": !selected,
                  })
                }
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Panel key={tab.key} value={tab.key} className="h-80 overflow-hidden overflow-y-auto">
              {tab.content}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </Popover.Panel>
    </Popover>
  );
};
