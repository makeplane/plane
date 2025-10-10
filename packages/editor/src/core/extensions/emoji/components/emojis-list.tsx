import { FloatingOverlay } from "@floating-ui/react";
import { SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { cn } from "@plane/utils";

export type EmojiItem = {
  name: string;
  emoji: string;
  shortcodes: string[];
  tags: string[];
  fallbackImage?: string;
};

export type EmojiListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

export type EmojisListDropdownProps = SuggestionProps<EmojiItem, { name: string }> & {
  onClose: () => void;
};

export const EmojisListDropdown = forwardRef<EmojiListRef, EmojisListDropdownProps>((props, ref) => {
  const { items, command, query, onClose } = props;
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
      if (query.length <= 0) {
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
    [query.length, items.length, selectItem, selectedIndex]
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

  if (query.length <= 0) return null;

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
          "relative max-h-80 w-[14rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg space-y-2 opacity-0 invisible transition-opacity",
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
                  "flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm text-left truncate text-custom-text-200 hover:bg-custom-background-80 transition-colors duration-150",
                  {
                    "bg-custom-background-80": isSelected,
                  }
                )}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="size-5 grid place-items-center flex-shrink-0 text-base">
                  {item.fallbackImage ? (
                    <img src={item.fallbackImage} alt={item.name} className="size-4 object-contain" />
                  ) : (
                    item.emoji
                  )}
                </span>
                <span className="flex-grow truncate">
                  <span className="font-medium">:{item.name}:</span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="text-center text-sm text-custom-text-400 py-2">No emojis found</div>
        )}
      </div>
    </>
  );
});

EmojisListDropdown.displayName = "EmojisListDropdown";
