import { computePosition, flip, shift } from "@floating-ui/dom";
import { posToDOMRect } from "@tiptap/react";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { SuggestionKeyDownProps } from "@tiptap/suggestion";
// local imports
import { EmojiList, EmojiListRef, EmojiListProps } from "./emojis-list";

export interface FloatingEmojiListProps extends EmojiListProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface FloatingEmojiListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const updatePosition = (editor: any, element: HTMLElement) => {
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

export const FloatingEmojiList = forwardRef<FloatingEmojiListRef, FloatingEmojiListProps>((props, ref) => {
  const { isOpen, onOpenChange, ...emojiListProps } = props;
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const emojiListRef = useRef<EmojiListRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose onKeyDown method via forwardRef
  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (keyProps: SuggestionKeyDownProps): boolean => {
        if (keyProps.event.key === "Escape") {
          onOpenChange(false);
          return true;
        }

        // Delegate to EmojiList
        if (emojiListRef.current) {
          return emojiListRef.current.onKeyDown({ event: keyProps.event });
        }

        return false;
      },
    }),
    [onOpenChange]
  );

  // Animation effect
  useEffect(() => {
    if (isOpen) {
      setIsAnimatedIn(false);
      // Add a small delay before starting the animation
      const timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsAnimatedIn(true);
        });
      }, 50);

      return () => clearTimeout(timeout);
    } else {
      setIsAnimatedIn(false);
    }
  }, [isOpen]);

  // Update position when component mounts or editor changes
  useEffect(() => {
    if (isOpen && containerRef.current && emojiListProps.editor) {
      updatePosition(emojiListProps.editor, containerRef.current);
    }
  }, [isOpen, emojiListProps.editor, emojiListProps.items]);

  // Handle scroll events to update position
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && containerRef.current && emojiListProps.editor) {
        updatePosition(emojiListProps.editor, containerRef.current);
      }
    };

    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, emojiListProps.editor]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        zIndex: 100,
      }}
      className={`transition-all duration-200 transform ${
        isAnimatedIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <EmojiList ref={emojiListRef} {...emojiListProps} />
    </div>
  );
});

FloatingEmojiList.displayName = "FloatingEmojiList";
