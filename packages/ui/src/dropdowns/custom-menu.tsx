import { Menu } from "@base-ui-components/react/menu";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { cn } from "../utils";
import { ICustomMenuDropdownProps, ICustomMenuItemProps, ICustomSubMenuProps } from "./helper";

// Context for main menu to communicate with submenus
const MenuContext = React.createContext<{
  closeAllSubmenus: () => void;
  registerSubmenu: (closeSubmenu: () => void) => () => void;
} | null>(null);

// SubMenu context for closing submenu from nested items
const SubMenuContext = React.createContext<{ closeSubmenu: () => void } | null>(null);

// Hook to use submenu context
const useSubMenu = () => React.useContext(SubMenuContext);

// SubMenu implementation
const SubMenu: React.FC<ICustomSubMenuProps> = (props) => {
  const { children, trigger, disabled = false, className = "", contentClassName = "" } = props;

  return (
    <Menu.SubmenuRoot disabled={disabled}>
      <Menu.SubmenuTrigger className={""}>
        <span className="flex-1">{trigger}</span>
        <ChevronRight />
      </Menu.SubmenuTrigger>
      <Menu.Portal>
        <Menu.Positioner className={""} alignOffset={-4} sideOffset={-4}>
          <Menu.Popup className={className}>{children} </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.SubmenuRoot>
  );
};

const MenuItem: React.FC<ICustomMenuItemProps> = (props) => {
  const { children, disabled = false, onClick, className } = props;
  const submenuContext = useSubMenu();

  return (
    <Menu.Item
      disabled={disabled}
      className={cn(
        "w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 cursor-pointer outline-none focus:bg-custom-background-80",
        {
          "text-custom-text-400": disabled,
        },
        className
      )}
      onClick={(e) => {
        close();
        onClick?.(e);
        submenuContext?.closeSubmenu();
      }}
    >
      {children}
    </Menu.Item>
  );
};

function CustomMenu(props: ICustomMenuDropdownProps) {
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
    handleOpenChange = () => {},
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  // refs
  const submenuClosersRef = React.useRef<Set<() => void>>(new Set());

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
  };

  const closeDropdown = React.useCallback(() => {
    if (isOpen) {
      closeAllSubmenus();
      onMenuClose?.();
    }
    setIsOpen(false);
  }, [isOpen, closeAllSubmenus, onMenuClose]);

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

  return (
    <Menu.Root openOnHover={openOnHover} onOpenChange={handleOpenChange}>
      {customButton ? (
        <Menu.Trigger
          type="button"
          onClick={handleMenuButtonClick}
          className={cn(customButtonClassName, "outline-none")}
          tabIndex={customButtonTabIndex}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {customButton}
        </Menu.Trigger>
      ) : (
        <>
          {ellipsis || verticalEllipsis ? (
            <Menu.Trigger
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
            </Menu.Trigger>
          ) : (
            <Menu.Trigger
              type="button"
              className={`flex items-center justify-between gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs duration-300 outline-none ${
                isOpen ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
              } ${noBorder ? "" : "border border-custom-border-300 shadow-sm focus:outline-none"} ${
                disabled ? "cursor-not-allowed text-custom-text-200" : "cursor-pointer hover:bg-custom-background-80"
              } ${buttonClassName}`}
              onClick={handleMenuButtonClick}
              tabIndex={customButtonTabIndex}
              disabled={disabled}
              aria-label={ariaLabel}
            >
              {label}
              {!noChevron && <ChevronDown className="h-3.5 w-3.5" />}
            </Menu.Trigger>
          )}
        </>
      )}
      <Menu.Portal>
        <Menu.Positioner
          align={"start"}
          className={cn(
            "fixed z-30 translate-y-0",
            menuItemsClassName
          )} /** translate-y-0 is a hack to create new stacking context. Required for safari  */
        >
          <Menu.Popup
            tabIndex={tabIndex}
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
            data-main-menu="true"
          >
            <MenuContext.Provider value={{ closeAllSubmenus, registerSubmenu }}>{children}</MenuContext.Provider>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

CustomMenu.MenuItem = MenuItem;
CustomMenu.SubMenu = SubMenu;
export { CustomMenu };
