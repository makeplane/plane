import { useMemo, useCallback } from "react";
import { Tabs } from "@base-ui-components/react";
import { Popover } from "../popover";
import { cn } from "../utils/classname";
import { convertPlacementToSideAndAlign } from "../utils/placement";
import { EmojiRoot } from "./emoji/emoji";
import type { TCustomEmojiPicker } from "./helper";
import { emojiToString, EmojiIconPickerTypes } from "./helper";
import { IconRoot } from "./icon/icon-root";

export function EmojiPicker(props: TCustomEmojiPicker) {
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
    // 新增：仅显示特定页签（如 ["icon"]）
    tabsToShow,
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

  // 新增：根据 tabsToShow 过滤显示的页签
  const filteredTabs = useMemo(() => {
    if (!tabsToShow || tabsToShow.length === 0) return tabs;
    const allowed = new Set(tabsToShow);
    return tabs.filter((t) => allowed.has(t.key as typeof EmojiIconPickerTypes.EMOJI | typeof EmojiIconPickerTypes.ICON));
  }, [tabs, tabsToShow]);

  // 新增：纠正默认打开页签，若 defaultOpen 不在 filteredTabs 中，回退到第一个或 ICON
  const effectiveDefaultOpen = useMemo(() => {
    if (filteredTabs.some((t) => t.key === defaultOpen)) return defaultOpen;
    return filteredTabs[0]?.key ?? EmojiIconPickerTypes.ICON;
  }, [filteredTabs, defaultOpen]);

  return (
    <Popover open={isOpen} onOpenChange={handleToggle}>
      <Popover.Button className={cn("outline-none", buttonClassName)} disabled={disabled}>
        {label}
      </Popover.Button>
      <Popover.Panel
        positionerClassName="z-50"
        className={cn("w-80 bg-surface-1 rounded-md border-[0.5px] border-strong overflow-hidden", dropdownClassName)}
        side={finalSide}
        align={finalAlign}
        sideOffset={8}
        data-prevent-outside-click="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            return;
          }
          if (e.key === "Escape") {
            handleToggle(false);
            return;
          }
          e.stopPropagation();
        }}
      >
        <Tabs.Root defaultValue={effectiveDefaultOpen}>
          <Tabs.List className={cn("grid gap-1 px-3.5 pt-3", filteredTabs.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {filteredTabs.map((tab) => (
              <Tabs.Tab
                key={tab.key}
                value={tab.key}
                className={({ selected }) =>
                  cn("py-1 text-13 rounded-sm border border-subtle bg-layer-1", {
                    "bg-surface-1 text-primary": selected,
                    "text-placeholder hover:text-tertiary hover:bg-layer-1/60": !selected,
                  })
                }
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {filteredTabs.map((tab) => (
            <Tabs.Panel key={tab.key} value={tab.key} className="h-80 overflow-hidden overflow-y-auto">
              {tab.content}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </Popover.Panel>
    </Popover>
  );
}
