import * as React from "react";
import ReactDOM from "react-dom";
import { Menu } from "@headlessui/react";
import { usePopper } from "react-popper";
import { ChevronDown, MoreHorizontal } from "lucide-react";
// hooks
import { useDropdownKeyDown } from "../hooks/use-dropdown-key-down";
import useOutsideClickDetector from "../hooks/use-outside-click-detector";
// helpers
import { cn } from "../../helpers";
// types
import { ICustomMenuDropdownProps, ICustomMenuItemProps } from "./helper";

const CustomMenu = (props: ICustomMenuDropdownProps) => {
  const {
    buttonClassName = "",
    customButtonClassName = "",
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
    verticalEllipsis = false,
    portalElement,
    menuButtonOnClick,
    tabIndex,
    closeOnSelect,
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
  const closeDropdown = () => setIsOpen(false);
  const handleKeyDown = useDropdownKeyDown(openDropdown, closeDropdown, isOpen);
  useOutsideClickDetector(dropdownRef, closeDropdown);

  let menuItems = (
    <Menu.Items
      className="fixed z-10"
      onClick={() => {
        if (closeOnSelect) closeDropdown();
      }}
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
      onKeyDown={handleKeyDown}
    >
      {({ open }) => (
        <>
          {customButton ? (
            <Menu.Button as={React.Fragment}>
              <button
                ref={setReferenceElement}
                type="button"
                onClick={() => {
                  openDropdown();
                  if (menuButtonOnClick) menuButtonOnClick();
                }}
                className={customButtonClassName}
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
                    onClick={() => {
                      openDropdown();
                      if (menuButtonOnClick) menuButtonOnClick();
                    }}
                    disabled={disabled}
                    className={`relative grid place-items-center rounded p-1 text-custom-text-200 outline-none hover:text-custom-text-100 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
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
                    onClick={() => {
                      openDropdown();
                      if (menuButtonOnClick) menuButtonOnClick();
                    }}
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
  const { children, onClick, className = "" } = props;
  return (
    <Menu.Item as="div">
      {({ active, close }) => (
        <button
          type="button"
          className={cn(
            "w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200",
            {
              "bg-custom-background-80": active,
            },
            className
          )}
          onClick={(e) => {
            close();
            onClick && onClick(e);
          }}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
};

CustomMenu.MenuItem = MenuItem;

export { CustomMenu };
