/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { EmojiPicker } from "frimousse";
import { Icon } from "@makeplane/propel/components/icon";
import { InputGroup } from "@makeplane/propel/components/input";
import { Input } from "@makeplane/propel/elements/input";
import { SearchOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";

/** Emoji cells per row; rows are a fixed grid of 32px cells so every column fits the picker. */
const EMOJI_COLUMNS = 9;

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
      columns={EMOJI_COLUMNS}
      className="isolate flex h-full w-full flex-col"
      onEmojiSelect={(val) => onChange(val.emoji)}
    >
      <div className="flex items-center gap-2 pb-1">
        <div ref={searchWrapperRef} data-slot="emoji-picker-search-wrapper" className="min-w-0 flex-1">
          <InputGroup size="md">
            <Icon icon={SearchOutline} tint="placeholder" />
            <Input
              size="md"
              render={
                <EmojiPicker.Search
                  placeholder={searchLabel}
                  aria-label={searchLabel}
                  disabled={searchDisabled}
                  value={searchQuery ?? ""}
                  onChange={(e) => onSearchQueryChange?.(e.target.value)}
                />
              }
            />
          </InputGroup>
        </div>
        <EmojiPicker.SkinToneSelector
          data-slot="emoji-picker-skin-tone-selector"
          className="grid size-7 flex-shrink-0 place-items-center rounded-md bg-layer-3 text-body-md-regular hover:bg-layer-3-hover"
        />
      </div>
      {/* frimousse reserves a stable scrollbar gutter by default, which narrows the rows below nine 32px
          cells wherever scrollbars are always shown; don't reserve one. */}
      <EmojiPicker.Viewport
        data-slot="emoji-picker-content"
        className="relative flex-1 outline-none"
        style={{ scrollbarGutter: "auto" }}
      >
        <EmojiPicker.List
          data-slot="emoji-picker-list"
          className="pb-2 select-none"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              // frimousse renders headers sticky inside the scrolling viewport, so they need an
              // opaque background or rows scroll visibly underneath the label text.
              <div
                data-slot="emoji-picker-list-category-header"
                className="bg-layer-2 pt-2 pb-1.5 text-caption-sm-medium text-tertiary"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, style, ...props }) => (
              <div
                data-slot="emoji-picker-list-row"
                className="scroll-my-1.5 justify-between"
                {...props}
                // A grid of cells up to 32px spread across the row, so the columns line up row to row and
                // still all fit when an always-visible scrollbar takes some of the width.
                style={{
                  ...style,
                  display: "grid",
                  gridTemplateColumns: "repeat(var(--frimousse-list-columns), minmax(0, 2rem))",
                }}
              >
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                type="button"
                aria-label={emoji?.label ?? emoji?.emoji}
                data-slot="emoji-picker-list-emoji"
                className="data-active:bg-accent flex h-8 w-full max-w-8 items-center justify-center rounded-md text-body-md-regular"
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
