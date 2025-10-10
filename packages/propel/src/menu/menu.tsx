import * as React from "react";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../utils/classname";
import { TMenuProps, TSubMenuProps, TMenuItemProps } from "./types";

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
const SubMenu: React.FC<TSubMenuProps> = (props) => {
  const { children, trigger, disabled = false, className = "" } = props;

  return (
    <BaseMenu.SubmenuRoot disabled={disabled}>
      <BaseMenu.SubmenuTrigger className={""}>
        <span className="flex-1">{trigger}</span>
        <ChevronRight />
      </BaseMenu.SubmenuTrigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={""} alignOffset={-4} sideOffset={-4}>
          <BaseMenu.Popup className={className}>{children} </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.SubmenuRoot>
  );
};

const MenuItem: React.FC<TMenuItemProps> = (props) => {
  const { children, disabled = false, onClick, className } = props;
  const submenuContext = useSubMenu();

  return (
    <BaseMenu.Item
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
    </BaseMenu.Item>
  );
};

function Menu(props: TMenuProps) {
  const {
    ariaLabel,
    buttonClassName = "",
    customButtonClassName = "",
    customButtonTabIndex = 0,
    children,
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
    menuButtonOnClick,
    onMenuClose,
    tabIndex,
    openOnHover = false,
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
    <BaseMenu.Root openOnHover={openOnHover} onOpenChange={handleOpenChange}>
      {customButton ? (
        <BaseMenu.Trigger
          type="button"
          onClick={handleMenuButtonClick}
          className={cn(customButtonClassName, "outline-none")}
          tabIndex={customButtonTabIndex}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {customButton}
        </BaseMenu.Trigger>
      ) : (
        <>
          {ellipsis || verticalEllipsis ? (
            <BaseMenu.Trigger
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
            </BaseMenu.Trigger>
          ) : (
            <BaseMenu.Trigger
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
            </BaseMenu.Trigger>
          )}
        </>
      )}
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          align={"start"}
          className={cn(
            "fixed z-30 translate-y-0",
            menuItemsClassName
          )} /** translate-y-0 is a hack to create new stacking context. Required for safari  */
        >
          <BaseMenu.Popup
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
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

Menu.MenuItem = MenuItem;
Menu.SubMenu = SubMenu;

export { Menu };
