import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// components
import { ContextMenuItem } from "./item";
// helpers
import { cn } from "../../../helpers";
// hooks
import { usePlatformOS } from "../../hooks/use-platform-os";

export type TContextMenuItem = {
  key: string;
  title: string;
  description?: string;
  icon?: React.FC<any>;
  action: () => void;
  shouldRender?: boolean;
  closeOnClick?: boolean;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
};

type ContextMenuProps = {
  parentRef: React.RefObject<HTMLElement>;
  items: TContextMenuItem[];
};

const ContextMenuWithoutPortal: React.FC<ContextMenuProps> = (props) => {
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
  const { isMobile } = usePlatformOS();

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
      if (isMobile) return;

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
  }, [contextMenuRef, isMobile, isOpen, parentRef, setIsOpen, setPosition]);

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
        const item = renderedItems[activeItemIndex];
        if (!item.disabled) {
          renderedItems[activeItemIndex].action();
          if (item.closeOnClick !== false) handleClose();
        }
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
        "fixed h-screen w-screen top-0 left-0 cursor-default z-20 opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
    >
      <div
        ref={contextMenuRef}
        className="fixed border-[0.5px] border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg rounded-md px-2 py-2.5 max-h-72 min-w-[12rem] overflow-y-scroll vertical-scrollbar scrollbar-sm"
        style={{
          top: position.y,
          left: position.x,
        }}
      >
        {renderedItems.map((item, index) => (
          <ContextMenuItem
            key={item.key}
            handleActiveItem={() => setActiveItemIndex(index)}
            handleClose={handleClose}
            isActive={index === activeItemIndex}
            item={item}
          />
        ))}
      </div>
    </div>
  );
};

export const ContextMenu: React.FC<ContextMenuProps> = (props) => {
  let contextMenu = <ContextMenuWithoutPortal {...props} />;
  const portal = document.querySelector("#context-menu-portal");
  if (portal) contextMenu = ReactDOM.createPortal(contextMenu, portal);
  return contextMenu;
};
