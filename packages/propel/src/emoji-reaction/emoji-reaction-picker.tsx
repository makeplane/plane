/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo, useCallback } from "react";
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
  /**
   * Content rendered *inside* the trigger. The trigger already is a `<button>`, so this
   * must stay inert markup -- handing it an interactive element nests a button in a button.
   * When the trigger itself should be an existing button, use `render` instead.
   */
  label?: React.ReactNode;
  /**
   * base-ui escape hatch (the equivalent of Radix's `asChild`, which Plane does not use):
   * the given element *becomes* the trigger rather than being wrapped in one. Pass a
   * component that forwards its ref and spreads its props, e.g. `EmojiReactionButton`.
   */
  render?: React.ComponentProps<typeof Popover.Button>["render"];
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
    render,
    onChange,
    placement = "bottom-start",
    searchDisabled = false,
    searchPlaceholder = "Search",
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
      const emoji = emojiToString(value);
      onChange(emoji);
      if (closeOnSelect) handleToggle(false);
    },
    [onChange, closeOnSelect, handleToggle]
  );

  // `label` fills the trigger, `render` replaces it -- never both: base-ui merges the
  // component's props into the rendered element, so a `children` of `undefined` would
  // clobber the children that element renders for itself.
  const triggerProps = render ? { render } : { children: label };

  return (
    <Popover open={isOpen} onOpenChange={handleToggle}>
      <Popover.Button className={cn("outline-none", buttonClassName)} disabled={disabled} {...triggerProps} />
      <Popover.Panel
        positionerClassName="z-50"
        className={cn("w-80 overflow-hidden rounded-md border-[0.5px] border-strong bg-surface-1", dropdownClassName)}
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
          />
        </div>
      </Popover.Panel>
    </Popover>
  );
}
