/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { EmojiPicker } from "frimousse";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type EmojiRootProps = {
  onChange: (value: string) => void;
  searchPlaceholder?: string;
  searchDisabled?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
};

export function EmojiRoot(props: EmojiRootProps) {
  const { onChange, searchPlaceholder, searchDisabled = false, searchQuery, onSearchQueryChange } = props;
  const { t } = useTranslation();
  const searchLabel = searchPlaceholder ?? t("common.search.label");
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focusInput = () => {
      const searchWrapper = searchWrapperRef.current;
      if (searchWrapper) {
        const inputElement = searchWrapper.querySelector("input");
        if (inputElement) {
          inputElement.removeAttribute("disabled");
          inputElement.focus();
        }
      }
    };
    focusInput();
  }, []);

  return (
    <EmojiPicker.Root
      data-slot="emoji-picker"
      className="isolate flex h-full w-full flex-col rounded-md border-none"
      onEmojiSelect={(val) => onChange(val.emoji)}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-1.5 py-2 [&>[data-slot='emoji-picker-search-wrapper']]:flex-grow [&>[data-slot='emoji-picker-search-wrapper']]:p-0">
        <div ref={searchWrapperRef} data-slot="emoji-picker-search-wrapper" className="">
          <EmojiPicker.Search
            placeholder={searchLabel}
            aria-label={searchLabel}
            disabled={searchDisabled}
            value={searchQuery ?? ""}
            onChange={(e) => onSearchQueryChange?.(e.target.value)}
            className="block h-full w-full flex-grow-0 rounded-md border-[0.5px] border-subtle bg-transparent p-0 px-3 py-2 text-body-md-regular placeholder-(--text-color-placeholder) focus:border-accent-strong focus:outline-none"
          />
        </div>
        <EmojiPicker.SkinToneSelector
          data-slot="emoji-picker-skin-tone-selector"
          className="hover:bg-accent mx-2 mb-1.5 size-8 flex-shrink-0 rounded-md text-body-md-regular"
        />
      </div>
      <EmojiPicker.Viewport data-slot="emoji-picker-content" className={cn("relative flex-1 outline-none")}>
        <EmojiPicker.List
          data-slot="emoji-picker-list"
          className={cn("pb-2 select-none")}
          components={{
            CategoryHeader: ({ category, ...props }) => (
              // frimousse renders headers sticky inside the scrolling viewport, so they need an
              // opaque background or rows scroll visibly underneath the label text.
              <div
                data-slot="emoji-picker-list-category-header"
                className="bg-layer-2 px-3 pb-1.5 text-caption-sm-medium text-tertiary"
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
                className="data-active:bg-accent flex size-8 items-center justify-center rounded-md text-body-md-regular"
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
