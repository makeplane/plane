/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo, useCallback, useState } from "react";
import { Tabs } from "@base-ui/react";
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
    showEmojiTab = true,
  } = props;

  const [searchQuery, setSearchQuery] = useState("");

  const { finalSide, finalAlign } = useMemo(() => {
    if (placement) {
      const converted = convertPlacementToSideAndAlign(placement);
      return { finalSide: converted.side, finalAlign: converted.align };
    }
    return { finalSide: side, finalAlign: align };
  }, [placement, side, align]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) setSearchQuery("");
      handleToggle(value);
    },
    [handleToggle]
  );

  const handleEmojiChange = useCallback(
    (value: string) => {
      onChange({
        type: EmojiIconPickerTypes.EMOJI,
        value: emojiToString(value),
      });
      if (closeOnSelect) handleOpenChange(false);
    },
    [onChange, closeOnSelect, handleOpenChange]
  );

  const handleIconChange = useCallback(
    (value: { name: string; color: string }) => {
      onChange({
        type: EmojiIconPickerTypes.ICON,
        value,
      });
      if (closeOnSelect) handleOpenChange(false);
    },
    [onChange, closeOnSelect, handleOpenChange]
  );

  const tabs = useMemo(
    () =>
      [
        showEmojiTab
          ? {
              key: "emoji",
              label: "Emoji",
              content: (
                <EmojiRoot
                  onChange={handleEmojiChange}
                  searchPlaceholder={searchPlaceholder}
                  searchDisabled={searchDisabled}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                />
              ),
            }
          : null,
        {
          key: "icon",
          label: "Icon",
          content: (
            <IconRoot
              defaultColor={defaultIconColor}
              onChange={handleIconChange}
              searchDisabled={searchDisabled}
              iconType={iconType}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          ),
        },
      ].filter((tab): tab is NonNullable<typeof tab> => !!tab),
    [
      defaultIconColor,
      searchDisabled,
      searchPlaceholder,
      iconType,
      searchQuery,
      handleEmojiChange,
      handleIconChange,
      showEmojiTab,
    ]
  );

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger className={cn("outline-none", buttonClassName)} disabled={disabled}>
        {label}
      </Popover.Trigger>
      <Popover.Content
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
            handleOpenChange(false);
            return;
          }
          e.stopPropagation();
        }}
      >
        <Tabs.Root defaultValue={showEmojiTab ? defaultOpen : EmojiIconPickerTypes.ICON}>
          {tabs.length > 1 && (
            <Tabs.List className="grid grid-cols-2 gap-1 px-3.5 pt-3">
              {tabs.map((tab) => (
                <Tabs.Tab
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    "py-1 text-13 rounded-sm border border-subtle bg-layer-1",
                    "data-[active]:bg-surface-1 data-[active]:text-primary data-[active]:hover:text-primary",
                    "hover:text-tertiary hover:bg-layer-1/60 text-placeholder"
                  )}
                >
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          )}
          {tabs.map((tab) => (
            <Tabs.Panel key={tab.key} value={tab.key} className="h-80 overflow-hidden overflow-y-auto">
              {tab.content}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </Popover.Content>
    </Popover>
  );
}
