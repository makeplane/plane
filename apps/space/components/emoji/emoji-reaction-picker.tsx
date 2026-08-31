/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { EmojiPicker } from "frimousse";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { emojiToString } from "./helpers";

type EmojiRootProps = {
  onChange: (value: string) => void;
  searchPlaceholder?: string;
};

function EmojiRoot(props: EmojiRootProps) {
  const { onChange, searchPlaceholder = "Search" } = props;
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputElement = searchWrapperRef.current?.querySelector("input");
    if (inputElement) {
      inputElement.removeAttribute("disabled");
      inputElement.focus();
    }
  }, []);

  return (
    <EmojiPicker.Root
      data-slot="emoji-picker"
      className="isolate flex h-full w-full flex-col rounded-md border-none p-2"
      onEmojiSelect={(val) => onChange(val.emoji)}
    >
      <div className="sticky top-0 z-10 flex items-center bg-layer-2 px-1.5 py-2">
        <div ref={searchWrapperRef} data-slot="emoji-picker-search-wrapper" className="flex-grow">
          <EmojiPicker.Search
            placeholder={searchPlaceholder}
            className="block h-full w-full rounded-md border-[0.5px] border-subtle bg-transparent px-3 py-2 text-16 placeholder-(--text-color-placeholder) focus:border-accent-strong focus:outline-none"
          />
        </div>
      </div>
      <EmojiPicker.Viewport data-slot="emoji-picker-content" className="relative flex-1 outline-none">
        <EmojiPicker.List
          data-slot="emoji-picker-list"
          className="pb-2 select-none"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                data-slot="emoji-picker-list-category-header"
                className="bg-layer-2 px-3 pb-1.5 text-11 font-medium text-tertiary"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div data-slot="emoji-picker-list-row" className="scroll-my-1.5 px-1.5" {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                type="button"
                aria-label={emoji?.label ?? emoji?.emoji}
                data-slot="emoji-picker-list-emoji"
                className="data-active:bg-accent flex size-8 items-center justify-center rounded-md text-16"
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  );
}

type TPlacement = "top" | "right" | "bottom" | "left" | `${"top" | "right" | "bottom" | "left"}-${"start" | "end"}`;

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
  searchPlaceholder?: string;
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
    searchPlaceholder = "Search",
  } = props;

  const { side, align } = useMemo(() => {
    const [rawSide, rawAlign] = placement.split("-") as ["top" | "right" | "bottom" | "left", ("start" | "end")?];
    return { side: rawSide, align: rawAlign ?? "start" };
  }, [placement]);

  const handleEmojiChange = useCallback(
    (value: string) => {
      onChange(emojiToString(value));
      if (closeOnSelect) handleToggle(false);
    },
    [onChange, closeOnSelect, handleToggle]
  );

  return (
    <Popover open={isOpen} onOpenChange={handleToggle}>
      <PopoverTrigger
        render={<button type="button" className={cn("outline-none", buttonClassName)} disabled={disabled} />}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} sideOffset={8}>
        {/* bleed past the propel popup's default padding so the picker fills the panel */}
        <div className={cn("-m-4 h-80 w-80 overflow-hidden rounded-[inherit]", dropdownClassName)}>
          <EmojiRoot onChange={handleEmojiChange} searchPlaceholder={searchPlaceholder} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
