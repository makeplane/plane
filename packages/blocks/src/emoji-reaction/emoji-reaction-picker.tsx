/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { EmojiRoot } from "../emoji-icon-picker/emoji/emoji";
import { emojiToString } from "../emoji-icon-picker/helper";
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { convertPlacementToSideAndAlign } from "../utils/placement";
import type { Placement, Side, Align } from "../utils/placement";

export type EmojiReactionPickerProps = {
  isOpen: boolean;
  handleToggle: (value: boolean) => void;
  buttonClassName?: string;
  closeOnSelect?: boolean;
  disabled?: boolean;
  dropdownClassName?: string;
  label: React.ReactNode;
  onChange: (emoji: string) => void;
  placement?: Placement;
  searchDisabled?: boolean;
  searchPlaceholder?: string;
  side?: Side;
  align?: Align;
};

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
    searchPlaceholder,
    side = "bottom",
    align = "start",
  } = props;
  // plane hooks
  const { t } = useTranslation();

  // local search state
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("common.search.label");

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
      <PopoverTrigger
        disabled={disabled}
        render={<button type="button" className={cn("outline-none", buttonClassName)} disabled={disabled} />}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent
        variant="rich"
        side={finalSide}
        align={finalAlign}
        sideOffset={8}
        data-prevent-outside-click="true"
      >
        <PopoverBody tabIndex={0}>
          <div className={cn("h-80", dropdownClassName)}>
            <EmojiRoot
              onChange={handleEmojiChange}
              searchPlaceholder={resolvedSearchPlaceholder}
              searchDisabled={searchDisabled}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
