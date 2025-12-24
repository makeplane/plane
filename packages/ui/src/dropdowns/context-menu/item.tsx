import React, { useState, useRef, useContext } from "react";
import { usePopper } from "react-popper";
import { ChevronRightIcon } from "@plane/propel/icons";
// helpers
import { cn } from "../../utils";
// types
import type { TContextMenuItem } from "./root";
import { ContextMenuContext, Portal } from "./root";

type ContextMenuItemProps = {
  handleActiveItem: () => void;
  handleClose: () => void;
  isActive: boolean;
  item: TContextMenuItem;
};

export function ContextMenuItem(props: ContextMenuItemProps) {
  const { handleActiveItem, handleClose, isActive, item } = props;

  // Nested menu state
  const [isNestedOpen, setIsNestedOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [activeNestedIndex, setActiveNestedIndex] = useState<number>(0);
  const nestedMenuRef = useRef<HTMLDivElement | null>(null);

  const contextMenuContext = useContext(ContextMenuContext);
  const hasNestedItems = item.nestedMenuItems && item.nestedMenuItems.length > 0;
  const renderedNestedItems = item.nestedMenuItems?.filter((nestedItem) => nestedItem.shouldRender !== false) || [];

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-start",
    strategy: "fixed",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 4],
        },
      },
      {
        name: "flip",
        options: {
          fallbackPlacements: ["left-start", "right-end", "left-end", "top-start", "bottom-start"],
        },
      },
      {
        name: "preventOverflow",
        options: {
          padding: 8,
        },
      },
    ],
  });

  const closeNestedMenu = React.useCallback(() => {
    setIsNestedOpen(false);
    setActiveNestedIndex(0);
  }, []);

  // Register this nested menu with the main context
  React.useEffect(() => {
    if (contextMenuContext && hasNestedItems) {
      return contextMenuContext.registerSubmenu(closeNestedMenu);
    }
  }, [contextMenuContext, hasNestedItems, closeNestedMenu]);

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasNestedItems) {
      // Toggle nested menu
      if (!isNestedOpen && contextMenuContext) {
        contextMenuContext.closeAllSubmenus();
      }
      setIsNestedOpen(!isNestedOpen);
    } else {
      // Execute action for regular items
      item.action();
      if (item.closeOnClick !== false) handleClose();
    }
  };

  const handleMouseEnter = () => {
    handleActiveItem();

    if (hasNestedItems) {
      // Close other submenus and open this one
      if (contextMenuContext) {
        contextMenuContext.closeAllSubmenus();
      }
      setIsNestedOpen(true);
    }
  };

  const handleNestedItemClick = (nestedItem: TContextMenuItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    nestedItem.action();
    if (nestedItem.closeOnClick !== false) {
      handleClose(); // Close the entire context menu
    }
  };

  // Handle keyboard navigation for nested items
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isNestedOpen || !hasNestedItems) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveNestedIndex((prev) => (prev + 1) % renderedNestedItems.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveNestedIndex((prev) => (prev - 1 + renderedNestedItems.length) % renderedNestedItems.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const nestedItem = renderedNestedItems[activeNestedIndex];
        if (!nestedItem.disabled) {
          handleNestedItemClick(nestedItem);
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        closeNestedMenu();
      }
    };

    if (isNestedOpen && nestedMenuRef.current) {
      const menuElement = nestedMenuRef.current;
      menuElement.addEventListener("keydown", handleKeyDown);
      // Ensure the menu can receive keyboard events
      menuElement.setAttribute("tabindex", "-1");
      menuElement.focus();
      return () => {
        menuElement.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isNestedOpen, activeNestedIndex, renderedNestedItems, hasNestedItems, closeNestedMenu]);

  if (item.shouldRender === false) return null;

  return (
    <>
      <button
        ref={setReferenceElement}
        type="button"
        className={cn(
          "w-full flex items-center gap-2 px-1 py-1.5 text-left text-secondary rounded-sm text-11 select-none",
          {
            "bg-layer-transparent-hover": isActive,
            "text-placeholder": item.disabled,
          },
          item.className
        )}
        onClick={handleItemClick}
        onMouseEnter={handleMouseEnter}
        disabled={item.disabled}
      >
        {item.customContent ?? (
          <>
            {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
            <div className="flex-1">
              <h5>{item.title}</h5>
              {item.description && (
                <p
                  className={cn("text-tertiary whitespace-pre-line", {
                    "text-placeholder": item.disabled,
                  })}
                >
                  {item.description}
                </p>
              )}
            </div>
            {hasNestedItems && <ChevronRightIcon className="h-3 w-3 flex-shrink-0" />}
          </>
        )}
      </button>

      {/* Nested Menu */}
      {hasNestedItems && isNestedOpen && (
        <Portal container={contextMenuContext?.portalContainer}>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="fixed z-[35] min-w-[12rem] overflow-hidden rounded-md border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 text-11"
            data-context-submenu="true"
          >
            <div ref={nestedMenuRef} className="max-h-72 overflow-y-scroll vertical-scrollbar scrollbar-sm">
              {renderedNestedItems.map((nestedItem, index) => (
                <button
                  key={nestedItem.key}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-1 py-1.5 text-left text-secondary rounded-sm text-11 select-none",
                    {
                      "bg-layer-transparent-hover": index === activeNestedIndex,
                      "text-placeholder": nestedItem.disabled,
                    },
                    nestedItem.className
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNestedItemClick(nestedItem, e);
                  }}
                  onMouseEnter={() => setActiveNestedIndex(index)}
                  disabled={nestedItem.disabled}
                  data-context-submenu="true"
                >
                  {nestedItem.customContent ?? (
                    <>
                      {nestedItem.icon && <nestedItem.icon className={cn("h-3 w-3", nestedItem.iconClassName)} />}
                      <div>
                        <h5>{nestedItem.title}</h5>
                        {nestedItem.description && (
                          <p
                            className={cn("text-tertiary whitespace-pre-line", {
                              "text-placeholder": nestedItem.disabled,
                            })}
                          >
                            {nestedItem.description}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
