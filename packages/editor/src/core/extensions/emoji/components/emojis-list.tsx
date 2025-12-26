import { FloatingOverlay } from "@floating-ui/react";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
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
      <div
        ref={dropdownContainerRef}
        className={cn(
          "relative max-h-80 w-[14rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200 space-y-2 opacity-0 invisible transition-opacity",
          {
            "opacity-100 visible": isVisible,
          }
        )}
        style={{
          zIndex: 100,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {items.length ? (
          items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const emojiKey = item.shortcodes.join(" - ");

            return (
              <button
                key={emojiKey}
                id={`emoji-item-${index}`}
                type="button"
                className={cn(
                  "flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-13 text-left truncate text-secondary hover:bg-layer-1-hover transition-colors duration-150",
                  {
                    "bg-layer-1-hover": isSelected,
                  }
                )}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="size-5 grid place-items-center flex-shrink-0 text-14">{item.emoji}</span>
                <span className="flex-grow truncate">
                  <span className="font-medium">:{item.name}:</span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="text-center text-13 text-placeholder py-2">No emojis found</div>
        )}
      </div>
    </>
  );
});

EmojisListDropdown.displayName = "EmojisListDropdown";
