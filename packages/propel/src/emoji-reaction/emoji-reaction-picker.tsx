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

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { EmojiRoot } from "../emoji-icon-picker/emoji/emoji";
import { emojiToString } from "../emoji-icon-picker/helper";
import { Popover } from "../popover";
import { cn } from "../utils/classname";
import { convertPlacementToSideAndAlign } from "../utils/placement";
import type { TPlacement, TSide, TAlign } from "../utils/placement";

export interface EmojiReactionPickerProps {
  isOpen: boolean;
  handleToggle: (value: boolean) => void;
  buttonClassName?: string;
  closeOnSelect?: boolean;
  disabled?: boolean;
  dropdownClassName?: string;
  label: React.ReactNode;
  onChange: (emoji: string) => void;
  placement?: TPlacement;
  searchDisabled?: boolean;
  searchPlaceholder?: string;
  side?: TSide;
  align?: TAlign;
}

export function EmojiReactionPicker(props: EmojiReactionPickerProps) {
  const {
    isOpen,
    handleToggle,
    buttonClassName,
    closeOnSelect = true,
    disabled = false,
    dropdownClassName,
    label,
    onChange,
    placement = "bottom-start",
    searchDisabled = false,
    searchPlaceholder = "Search",
    side = "bottom",
    align = "start",
  } = props;

  // local search state
  const [searchQuery, setSearchQuery] = useState("");

  // clear search when picker closes
  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

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
      const emoji = emojiToString(value);
      onChange(emoji);
      if (closeOnSelect) handleToggle(false);
    },
    [onChange, closeOnSelect, handleToggle]
  );

  return (
    <Popover open={isOpen} onOpenChange={handleToggle}>
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
      >
        <div className="h-80 overflow-hidden overflow-y-auto">
          <EmojiRoot
            onChange={handleEmojiChange}
            searchPlaceholder={searchPlaceholder}
            searchDisabled={searchDisabled}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      </Popover.Content>
    </Popover>
  );
}
