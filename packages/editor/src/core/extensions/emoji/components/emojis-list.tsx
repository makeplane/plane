import { Editor } from "@tiptap/react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
// plane imports
import { cn } from "@plane/utils";

export interface EmojiItem {
  name: string;
  emoji: string;
  shortcodes: string[];
  tags: string[];
  fallbackImage?: string;
}

export interface EmojiListProps {
  items: EmojiItem[];
  command: (item: { name: string }) => void;
  editor: Editor;
}

export interface EmojiListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const EmojiList = forwardRef<EmojiListRef, EmojiListProps>((props, ref) => {
  const { items, command } = props;
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // refs
  const emojiListContainer = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (index: number): void => {
      const item = items[index];
      if (item) {
        command({ name: item.name });
      }
    },
    [command, items]
  );

  const upHandler = useCallback(() => {
    setSelectedIndex((prevIndex) => (prevIndex + items.length - 1) % items.length);
  }, [items.length]);

  const downHandler = useCallback(() => {
    setSelectedIndex((prevIndex) => (prevIndex + 1) % items.length);
  }, [items.length]);

  const enterHandler = useCallback(() => {
    setSelectedIndex((prevIndex) => {
      selectItem(prevIndex);
      return prevIndex;
    });
  }, [selectItem]);

  useEffect(() => setSelectedIndex(0), [items]);

  // scroll to the dropdown item when navigating via keyboard
  useLayoutEffect(() => {
    const container = emojiListContainer?.current;
    if (!container) return;

    const item = container.querySelector(`#emoji-item-${selectedIndex}`) as HTMLElement;
    if (item) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      const isItemInView = itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

      if (!isItemInView) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }): boolean => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          enterHandler();
          return true;
        }

        return false;
      },
    }),
    [upHandler, downHandler, enterHandler]
  );
  return (
    <div
      ref={emojiListContainer}
      role="listbox"
      aria-label="Emoji suggestions"
      className="z-10 max-h-[90vh] w-[16rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg space-y-1"
    >
      {items.length ? (
        items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const emojiKey = item.shortcodes.join(" - ");

          return (
            <button
              key={emojiKey}
              role="option"
              aria-selected={isSelected}
              aria-label={`${item.name} emoji`}
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
  );
});

EmojiList.displayName = "EmojiList";
