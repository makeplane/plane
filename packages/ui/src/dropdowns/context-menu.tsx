import React, { useEffect, useRef, useState } from "react";
// helpers
import { cn } from "../../helpers";
// hooks
import useOutsideClickDetector from "../hooks/use-outside-click-detector";

type MenuItem = {
  key: string;
  title: string;
  description?: string;
  icon?: React.FC<any>;
  action: () => void;
  shouldRender?: boolean;
  className?: string;
};

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  items: MenuItem[];
};

export const ContextMenu: React.FC<Props> = (props) => {
  const { parentRef, items } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  // refs
  const contextMenuRef = useRef<HTMLDivElement>(null);
  // derived values
  const renderedItems = items.filter((item) => item.shouldRender !== false);

  const handleClose = () => {
    setIsOpen(false);
    setActiveItemIndex(0);
  };

  // calculate position of context menu
  useEffect(() => {
    const parentElement = parentRef.current;
    const contextMenu = contextMenuRef.current;
    if (!parentElement || !contextMenu) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const contextMenuWidth = contextMenu.clientWidth;
      const contextMenuHeight = contextMenu.clientHeight;

      const clickX = e?.pageX || 0;
      const clickY = e?.pageY || 0;

      // check if there's enough space at the bottom, otherwise show at the top
      let top = clickY;
      if (clickY + contextMenuHeight > window.innerHeight) top = clickY - contextMenuHeight;

      // check if there's enough space on the right, otherwise show on the left
      let left = clickX;
      if (clickX + contextMenuWidth > window.innerWidth) left = clickX - contextMenuWidth;

      setPosition({ x: left, y: top });
      setIsOpen(true);
    };

    const hideContextMenu = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") handleClose();
    };

    parentElement.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", hideContextMenu);

    return () => {
      parentElement.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", hideContextMenu);
    };
  }, [contextMenuRef, isOpen, parentRef, setIsOpen, setPosition]);

  // handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveItemIndex((prev) => (prev + 1) % renderedItems.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveItemIndex((prev) => (prev - 1 + renderedItems.length) % renderedItems.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        renderedItems[activeItemIndex].action();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeItemIndex, isOpen, renderedItems, setIsOpen]);

  // close on clicking outside
  useOutsideClickDetector(contextMenuRef, handleClose);

  return (
    <div
      className={cn(
        "fixed size-full top-0 left-0 cursor-default z-20 opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
    >
      <div
        ref={contextMenuRef}
        className="fixed border-[0.5px] border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg rounded-md px-2 py-2.5 max-h-60 min-w-[12rem] overflow-y-scroll"
        style={{
          top: position.y,
          left: position.x,
        }}
      >
        {renderedItems.map((item, index) => {
          if (item.shouldRender === false) return null;
          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-1 py-1.5 text-left text-custom-text-200 rounded text-xs select-none",
                {
                  "bg-custom-background-90": activeItemIndex === index,
                },
                item.className
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              onMouseEnter={() => setActiveItemIndex(index)}
            >
              {item.icon && <item.icon className="h-3 w-3" />}
              <div>
                <h5>{item.title}</h5>
                {item.description && <p className="text-custom-text-300">{item.description}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContextMenu;
