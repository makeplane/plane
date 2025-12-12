import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
// hooks
import { usePlatformOS } from "../../hooks/use-platform-os";
// helpers
import { cn } from "../../utils";
// components
import { ContextMenuItem } from "./item";

export type TContextMenuItem = {
  key: string;
  customContent?: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.FC<any>;
  action: () => void;
  shouldRender?: boolean;
  closeOnClick?: boolean;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  nestedMenuItems?: TContextMenuItem[];
};

// Portal component for nested menus
interface PortalProps {
  children: React.ReactNode;
  container?: Element | null;
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const targetContainer = container || document.body;
  return ReactDOM.createPortal(children, targetContainer);
}

// Context for managing nested menus
export const ContextMenuContext = React.createContext<{
  closeAllSubmenus: () => void;
  registerSubmenu: (closeSubmenu: () => void) => () => void;
  portalContainer?: Element | null;
} | null>(null);

type ContextMenuProps = {
  parentRef: React.RefObject<HTMLElement>;
  items: TContextMenuItem[];
  portalContainer?: Element | null;
};

function ContextMenuWithoutPortal(props: ContextMenuProps) {
  const { parentRef, items, portalContainer } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  // refs
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const submenuClosersRef = useRef<Set<() => void>>(new Set());
  // derived values
  const renderedItems = items.filter((item) => item.shouldRender !== false);
  const { isMobile } = usePlatformOS();

  const closeAllSubmenus = React.useCallback(() => {
    submenuClosersRef.current.forEach((closeSubmenu) => closeSubmenu());
  }, []);

  const registerSubmenu = React.useCallback((closeSubmenu: () => void) => {
    submenuClosersRef.current.add(closeSubmenu);
    return () => {
      submenuClosersRef.current.delete(closeSubmenu);
    };
  }, []);

  const handleClose = () => {
    closeAllSubmenus();
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

  // Custom handler for nested menu portal clicks
  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the click is on a nested menu element
      const isNestedMenuClick = target.closest('[data-context-submenu="true"]');
      const isMainMenuClick = contextMenuRef.current?.contains(target);

      // Also check if the target itself has the data attribute
      const isNestedMenuElement = target.hasAttribute("data-context-submenu");

      // If it's a nested menu click, main menu click, or nested menu element, don't close
      if (isNestedMenuClick || isMainMenuClick || isNestedMenuElement) {
        return;
      }

      // If menu is open and it's an outside click, close it
      if (isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      // Use capture phase to ensure we handle the event before other handlers
      document.addEventListener("mousedown", handleDocumentClick, true);
      return () => {
        document.removeEventListener("mousedown", handleDocumentClick, true);
      };
    }
  }, [isOpen, handleClose]);

  return (
    <div
      className={cn(
        "fixed h-screen w-screen top-0 left-0 cursor-default z-30 opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
    >
      <div
        ref={contextMenuRef}
        className="fixed border-[0.5px] border-subtle-1 bg-surface-1 rounded-md px-2 py-2.5 max-h-72 min-w-[12rem] overflow-y-scroll vertical-scrollbar scrollbar-sm"
        style={{
          top: position.y,
          left: position.x,
        }}
        data-context-menu="true"
      >
        <ContextMenuContext.Provider value={{ closeAllSubmenus, registerSubmenu, portalContainer }}>
          {renderedItems.map((item, index) => (
            <ContextMenuItem
              key={item.key}
              handleActiveItem={() => setActiveItemIndex(index)}
              handleClose={handleClose}
              isActive={index === activeItemIndex}
              item={item}
            />
          ))}
        </ContextMenuContext.Provider>
      </div>
    </div>
  );
}

export function ContextMenu(props: ContextMenuProps) {
  let contextMenu = <ContextMenuWithoutPortal {...props} />;
  const portal = document.querySelector("#context-menu-portal");
  if (portal) contextMenu = ReactDOM.createPortal(contextMenu, portal);
  return contextMenu;
}
