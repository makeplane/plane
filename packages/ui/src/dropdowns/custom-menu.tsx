import * as React from "react";
import ReactDOM from "react-dom";
import { Menu } from "@headlessui/react";
import { usePopper } from "react-popper";
import { ChevronDown, MoreHorizontal } from "lucide-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
// helpers
import { cn } from "../../helpers";
// types
import { ICustomMenuDropdownProps, ICustomMenuItemProps } from "./helper";

const CustomMenu = (props: ICustomMenuDropdownProps) => {
  const {
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

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });

  const openDropdown = () => {
    setIsOpen(true);
    if (referenceElement) referenceElement.focus();
  };
  const closeDropdown = () => {
    isOpen && onMenuClose && onMenuClose();
    setIsOpen(false);
  };

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
    isOpen ? closeDropdown() : openDropdown();
    if (menuButtonOnClick) menuButtonOnClick();
  };

  const handleMouseEnter = () => {
    if (openOnHover) openDropdown();
  };

  const handleMouseLeave = () => {
    if (openOnHover && isOpen) {
      setTimeout(() => {
        closeDropdown();
      }, 500);
    }
  };

  useOutsideClickDetector(dropdownRef, closeDropdown, useCaptureForOutsideClick);

  let menuItems = (
    <Menu.Items data-prevent-outside-click={!!portalElement} className={cn("fixed z-10", menuItemsClassName)} static>
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
        {children}
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
      onClick={handleOnClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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

const MenuItem: React.FC<ICustomMenuItemProps> = (props) => {
  const { children, disabled = false, onClick, className } = props;

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
            onClick && onClick(e);
          }}
          disabled={disabled}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
};

CustomMenu.MenuItem = MenuItem;

export { CustomMenu };
