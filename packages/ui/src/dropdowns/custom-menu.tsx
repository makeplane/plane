import { Menu } from "@headlessui/react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import { cn } from "../utils";
// hooks
// types
import {
  ICustomMenuDropdownProps,
  ICustomMenuItemProps,
  ICustomSubMenuProps,
  ICustomSubMenuTriggerProps,
  ICustomSubMenuContentProps,
} from "./helper";

interface PortalProps {
  children: React.ReactNode;
  container?: Element | null;
  asChild?: boolean;
}

const Portal: React.FC<PortalProps> = ({ children, container, asChild = false }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const targetContainer = container || document.body;

  if (asChild) {
    return ReactDOM.createPortal(children, targetContainer);
  }

  return ReactDOM.createPortal(<div data-radix-portal="">{children}</div>, targetContainer);
};

// Context for main menu to communicate with submenus
const MenuContext = React.createContext<{
  closeAllSubmenus: () => void;
  registerSubmenu: (closeSubmenu: () => void) => () => void;
} | null>(null);

const CustomMenu = (props: ICustomMenuDropdownProps) => {
  const {
    ariaLabel,
    buttonClassName = "",
    customButtonClassName = "",
    customButtonTabIndex = 0,
    placement,
    children,
    className = "",
    customButton,
    disabled = false,
    ellipsis = false,
    label,
    maxHeight = "md",
    noBorder = false,
    noChevron = false,
    optionsClassName = "",
    menuItemsClassName = "",
    verticalEllipsis = false,
    portalElement,
    menuButtonOnClick,
    onMenuClose,
    tabIndex,
    closeOnSelect,
    openOnHover = false,
    useCaptureForOutsideClick = false,
  } = props;

  const [referenceElement, setReferenceElement] = React.useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  // refs
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const submenuClosersRef = React.useRef<Set<() => void>>(new Set());

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });

  const closeAllSubmenus = React.useCallback(() => {
    submenuClosersRef.current.forEach((closeSubmenu) => closeSubmenu());
  }, []);

  const registerSubmenu = React.useCallback((closeSubmenu: () => void) => {
    submenuClosersRef.current.add(closeSubmenu);
    return () => {
      submenuClosersRef.current.delete(closeSubmenu);
    };
  }, []);

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  };

  const closeDropdown = React.useCallback(() => {
    if (isOpen) {
      closeAllSubmenus();
      onMenuClose?.();
    }
    setIsOpen(false);
  }, [isOpen, closeAllSubmenus, onMenuClose]);

  const selectActiveItem = () => {
    const activeItem: HTMLElement | undefined | null = dropdownRef.current?.querySelector(
      `[data-headlessui-state="active"] button`
    );
    activeItem?.click();
  };

  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen, selectActiveItem);

  const handleOnClick = () => {
    if (closeOnSelect) closeDropdown();
  };

  const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
    if (menuButtonOnClick) menuButtonOnClick();
  };

  const handleMouseEnter = () => {
    if (openOnHover) openDropdown();
  };

  const handleMouseLeave = () => {
    if (openOnHover && isOpen) {
      setTimeout(() => {
        // Only close if menu is still open
        if (isOpen) {
          closeDropdown();
        }
      }, 150); // Small delay to allow moving to submenu
    }
  };

  useOutsideClickDetector(dropdownRef, closeDropdown, useCaptureForOutsideClick);

  // Custom handler for submenu portal clicks
  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isSubmenuClick = target.closest('[data-prevent-outside-click="true"]');
      const isMainMenuClick = dropdownRef.current?.contains(target);

      // If it's a submenu click or main menu click, don't close
      if (isSubmenuClick || isMainMenuClick) {
        return;
      }

      // If menu is open and it's an outside click, close it
      if (isOpen) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleDocumentClick, useCaptureForOutsideClick);

      return () => {
        document.removeEventListener("mousedown", handleDocumentClick, useCaptureForOutsideClick);
      };
    }
  }, [isOpen, closeDropdown, useCaptureForOutsideClick]);

  let menuItems = (
    <Menu.Items
      data-prevent-outside-click={!!portalElement}
      className={cn(
        "fixed z-30 translate-y-0",
        menuItemsClassName
      )} /** translate-y-0 is a hack to create new stacking context. Required for safari  */
      static
    >
      <div
        className={cn(
          "my-1 overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-[12rem] whitespace-nowrap",
          {
            "max-h-60": maxHeight === "lg",
            "max-h-48": maxHeight === "md",
            "max-h-36": maxHeight === "rg",
            "max-h-28": maxHeight === "sm",
          },
          optionsClassName
        )}
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <MenuContext.Provider value={{ closeAllSubmenus, registerSubmenu }}>{children}</MenuContext.Provider>
      </div>
    </Menu.Items>
  );

  if (portalElement) {
    menuItems = ReactDOM.createPortal(menuItems, portalElement);
  }

  return (
    <Menu
      as="div"
      ref={dropdownRef}
      tabIndex={tabIndex}
      className={cn("relative w-min text-left", className)}
      onKeyDownCapture={handleKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleOnClick();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-main-menu="true"
    >
      {({ open }) => (
        <>
          {customButton ? (
            <Menu.Button as={React.Fragment}>
              <button
                ref={setReferenceElement}
                type="button"
                onClick={handleMenuButtonClick}
                className={customButtonClassName}
                tabIndex={customButtonTabIndex}
                disabled={disabled}
                aria-label={ariaLabel}
              >
                {customButton}
              </button>
            </Menu.Button>
          ) : (
            <>
              {ellipsis || verticalEllipsis ? (
                <Menu.Button as={React.Fragment}>
                  <button
                    ref={setReferenceElement}
                    type="button"
                    onClick={handleMenuButtonClick}
                    disabled={disabled}
                    className={`relative grid place-items-center rounded p-1 text-custom-text-200 outline-none hover:text-custom-text-100 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
                    tabIndex={customButtonTabIndex}
                    aria-label={ariaLabel}
                  >
                    <MoreHorizontal className={`h-3.5 w-3.5 ${verticalEllipsis ? "rotate-90" : ""}`} />
                  </button>
                </Menu.Button>
              ) : (
                <Menu.Button as={React.Fragment}>
                  <button
                    ref={setReferenceElement}
                    type="button"
                    className={`flex items-center justify-between gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs duration-300 ${
                      open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                    } ${noBorder ? "" : "border border-custom-border-300 shadow-sm focus:outline-none"} ${
                      disabled
                        ? "cursor-not-allowed text-custom-text-200"
                        : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
                    onClick={handleMenuButtonClick}
                    tabIndex={customButtonTabIndex}
                    disabled={disabled}
                    aria-label={ariaLabel}
                  >
                    {label}
                    {!noChevron && <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </Menu.Button>
              )}
            </>
          )}
          {isOpen && menuItems}
        </>
      )}
    </Menu>
  );
};

// SubMenu context for closing submenu from nested items
const SubMenuContext = React.createContext<{ closeSubmenu: () => void } | null>(null);

// Hook to use submenu context
const useSubMenu = () => React.useContext(SubMenuContext);

// SubMenu implementation
const SubMenu: React.FC<ICustomSubMenuProps> = (props) => {
  const {
    children,
    trigger,
    disabled = false,
    className = "",
    contentClassName = "",
    placement = "right-start",
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const [referenceElement, setReferenceElement] = React.useState<HTMLSpanElement | null>(null);
  const [popperElement, setPopperElement] = React.useState<HTMLDivElement | null>(null);
  const submenuRef = React.useRef<HTMLDivElement | null>(null);

  const menuContext = React.useContext(MenuContext);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: "fixed", // Use fixed positioning to escape overflow constraints
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

  const closeSubmenu = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  // Register this submenu with the main menu context
  React.useEffect(() => {
    if (menuContext) {
      return menuContext.registerSubmenu(closeSubmenu);
    }
  }, [menuContext, closeSubmenu]);

  const toggleSubmenu = () => {
    if (!disabled) {
      // Close other submenus when opening this one
      if (!isOpen && menuContext) {
        menuContext.closeAllSubmenus();
      }
      setIsOpen(!isOpen);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSubmenu();
  };

  // Close submenu when clicking on other menu items
  React.useEffect(() => {
    const handleMenuItemClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if the click is on a menu item that's not part of this submenu
      if (target.closest('[role="menuitem"]') && !submenuRef.current?.contains(target)) {
        closeSubmenu();
      }
    };

    document.addEventListener("click", handleMenuItemClick);
    return () => {
      document.removeEventListener("click", handleMenuItemClick);
    };
  }, [closeSubmenu]);

  return (
    <div ref={submenuRef} className={cn("relative", className)}>
      <span ref={setReferenceElement} className="w-full">
        <Menu.Item as="div" disabled={disabled}>
          {({ active }) => (
            <div
              className={cn(
                "w-full select-none rounded px-1 py-1.5 text-left text-custom-text-200 flex items-center justify-between cursor-pointer",
                {
                  "bg-custom-background-80": active && !disabled,
                  "text-custom-text-400": disabled,
                  "cursor-not-allowed": disabled,
                }
              )}
              onClick={handleClick}
            >
              <span className="flex-1">{trigger}</span>
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            </div>
          )}
        </Menu.Item>
      </span>

      {isOpen && (
        <Portal>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className={cn(
              "fixed z-30 min-w-[12rem] overflow-hidden rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 p-1 text-xs shadow-custom-shadow-lg",
              "ring-1 ring-black ring-opacity-5", // Additional styling to make it stand out
              contentClassName
            )}
            data-prevent-outside-click="true"
            onMouseEnter={() => {
              // Notify parent menu that we're hovering over submenu
              const mainMenuElement = document.querySelector('[data-main-menu="true"]');
              if (mainMenuElement) {
                const mouseEnterEvent = new MouseEvent("mouseenter", { bubbles: true });
                mainMenuElement.dispatchEvent(mouseEnterEvent);
              }
            }}
            onMouseLeave={() => {
              // Notify parent menu that we're leaving submenu
              const mainMenuElement = document.querySelector('[data-main-menu="true"]');
              if (mainMenuElement) {
                const mouseLeaveEvent = new MouseEvent("mouseleave", { bubbles: true });
                mainMenuElement.dispatchEvent(mouseLeaveEvent);
              }
            }}
          >
            <SubMenuContext.Provider value={{ closeSubmenu }}>{children}</SubMenuContext.Provider>
          </div>
        </Portal>
      )}
    </div>
  );
};

const MenuItem: React.FC<ICustomMenuItemProps> = (props) => {
  const { children, disabled = false, onClick, className } = props;
  const submenuContext = useSubMenu();

  return (
    <Menu.Item as="div" disabled={disabled}>
      {({ active, close }) => (
        <button
          type="button"
          className={cn(
            "w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200",
            {
              "bg-custom-background-80": active && !disabled,
              "text-custom-text-400": disabled,
            },
            className
          )}
          onClick={(e) => {
            close();
            onClick?.(e);
            // Close submenu if this item is inside a submenu
            submenuContext?.closeSubmenu();
          }}
          disabled={disabled}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
};

const SubMenuTrigger: React.FC<ICustomSubMenuTriggerProps> = (props) => {
  const { children, disabled = false, className } = props;

  return (
    <Menu.Item as="div" disabled={disabled}>
      {({ active }) => (
        <div
          className={cn(
            "w-full select-none rounded px-1 py-1.5 text-left text-custom-text-200 flex items-center justify-between",
            {
              "bg-custom-background-80": active && !disabled,
              "text-custom-text-400": disabled,
              "cursor-pointer": !disabled,
              "cursor-not-allowed": disabled,
            },
            className
          )}
        >
          <span className="flex-1">{children}</span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        </div>
      )}
    </Menu.Item>
  );
};

const SubMenuContent: React.FC<ICustomSubMenuContentProps> = (props) => {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "z-[15] min-w-[12rem] overflow-hidden rounded-md border border-custom-border-300 bg-custom-background-100 p-1 text-xs shadow-custom-shadow-rg",
        className
      )}
    >
      {children}
    </div>
  );
};

// Add all components as static properties for external use
CustomMenu.Portal = Portal;
CustomMenu.MenuItem = MenuItem;
CustomMenu.SubMenu = SubMenu;
CustomMenu.SubMenuTrigger = SubMenuTrigger;
CustomMenu.SubMenuContent = SubMenuContent;

export { CustomMenu };
