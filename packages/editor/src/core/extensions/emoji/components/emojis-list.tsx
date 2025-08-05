import { computePosition, flip, shift } from "@floating-ui/dom";
import { type Editor, posToDOMRect } from "@tiptap/react";
import { SuggestionKeyDownProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
// plane imports
import { cn } from "@plane/utils";

export type EmojiItem = {
  name: string;
  emoji: string;
  shortcodes: string[];
  tags: string[];
  fallbackImage?: string;
};

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  };

  computePosition(virtualElement, element, {
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    Object.assign(element.style, {
      width: "max-content",
      position: strategy,
      left: `${x}px`,
      top: `${y}px`,
    });
  });
};

export type EmojiListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type Props = {
  items: EmojiItem[];
  command: (item: { name: string }) => void;
  editor: Editor;
  query: string;
};

export const EmojiList = forwardRef<EmojiListRef, Props>((props, ref) => {
  const { items, command, editor, query } = props;
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (event.key === "Escape") {
        event.preventDefault();
        return true;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
    [query.length, items.length, selectItem, selectedIndex]
  );

  // Update position when items change
  useEffect(() => {
    if (containerRef.current && editor) {
      updatePosition(editor, containerRef.current);
    }
  }, [items, editor]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current && editor) {
        updatePosition(editor, containerRef.current);
      }
    };

    document.addEventListener("scroll", handleScroll, true);
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, [editor]);

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
    const container = containerRef.current;
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

  if (query.length <= 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        zIndex: 100,
      }}
      className={`transition-all duration-200 transform ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
    >
      <div className="z-10 max-h-[90vh] w-[16rem] overflow-y-auto rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg space-y-1">
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
    </div>
  );
});

EmojiList.displayName = "EmojiList";
