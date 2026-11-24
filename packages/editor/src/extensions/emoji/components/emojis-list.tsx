/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FloatingOverlay } from "@floating-ui/react";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
// propel imports
import {
  SuggestionMenu,
  SuggestionMenuGroup,
  SuggestionMenuItem,
  SuggestionMenuItemIcon,
  SuggestionMenuItemTitle,
} from "@makeplane/propel/elements/suggestion-menu";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { cn } from "@plane/utils";

export type EmojiItem = {
  name: string;
  emoji: string;
  shortcodes: string[];
  tags: string[];
};

export type EmojiListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

export type EmojisListDropdownProps = SuggestionProps<EmojiItem, { name: string }> & {
  onClose: () => void;
  forceOpen?: boolean;
};

export const EmojisListDropdown = forwardRef(function EmojisListDropdown(
  props: EmojisListDropdownProps,
  ref: React.ForwardedRef<EmojiListRef>
) {
  const { items, command, query, onClose, forceOpen = false } = props;
  // states
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  // refs
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number): void => {
      const item = items[index];
      if (item) {
        command({ name: item.name });
      }
    },
    [command, items]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      // Allow keyboard navigation if we have items to show
      if (items.length === 0) {
        return false;
      }

      // Don't handle keyboard if modal shouldn't be visible (query empty without forceOpen)
      if (query.length === 0 && !forceOpen) {
        return false;
      }

      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
    [items.length, query.length, forceOpen, selectItem, selectedIndex]
  );

  // Show animation
  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  // Reset selection when items change
  useEffect(() => setSelectedIndex(0), [items]);

  // Scroll selected item into view
  useEffect(() => {
    const container = dropdownContainerRef.current;
    if (!container) return;

    const item = container.querySelector(`#emoji-item-${selectedIndex}`) as HTMLElement;
    if (item) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps): boolean => handleKeyDown(event),
    }),
    [handleKeyDown]
  );

  useOutsideClickDetector(dropdownContainerRef, onClose);

  if (query.length === 0 && !forceOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <FloatingOverlay
        style={{
          zIndex: 99,
        }}
        lockScroll
      />
      <SuggestionMenu
        width="fit"
        render={
          <div
            ref={dropdownContainerRef}
            className={cn("invisible relative opacity-0 transition-opacity", {
              "visible opacity-100": isVisible,
            })}
            style={{ zIndex: 100 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          />
        }
      >
        {items.length ? (
          <SuggestionMenuGroup>
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const emojiKey = item.shortcodes.join(" - ");

              return (
                <SuggestionMenuItem
                  key={emojiKey}
                  data-highlighted={isSelected ? "" : undefined}
                  render={
                    <button
                      id={`emoji-item-${index}`}
                      type="button"
                      className="focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset"
                      style={{ textAlign: "start" }}
                      onClick={() => selectItem(index)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    />
                  }
                >
                  <SuggestionMenuItemIcon>{item.emoji}</SuggestionMenuItemIcon>
                  <SuggestionMenuItemTitle>:{item.name}:</SuggestionMenuItemTitle>
                </SuggestionMenuItem>
              );
            })}
          </SuggestionMenuGroup>
        ) : (
          <div className="p-2 text-center text-body-sm-regular text-placeholder">No emojis found</div>
        )}
      </SuggestionMenu>
    </>
  );
});

EmojisListDropdown.displayName = "EmojisListDropdown";
