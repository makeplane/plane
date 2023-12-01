import * as React from "react";

// react-poppper
import { usePopper } from "react-popper";
// headless ui
import { Menu } from "@headlessui/react";
// type
import { ICustomMenuDropdownProps, ICustomMenuItemProps } from "./helper";
// icons
import { ChevronDown, MoreHorizontal } from "lucide-react";

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
    width = "auto",
    menuButtonOnClick,
  } = props;

  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] =
    React.useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });
  return (
    <Menu as="div" className={`relative w-min text-left ${className}`}>
      {({ open }) => (
        <>
          {customButton ? (
            <Menu.Button as={React.Fragment}>
              <button
                ref={setReferenceElement}
                type="button"
                onClick={menuButtonOnClick}
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
                    onClick={menuButtonOnClick}
                    disabled={disabled}
                    className={`relative grid place-items-center rounded p-1 text-custom-text-200 hover:text-custom-text-100 outline-none ${
                      disabled
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
                  >
                    <MoreHorizontal
                      className={`h-3.5 w-3.5 ${
                        verticalEllipsis ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </Menu.Button>
              ) : (
                <Menu.Button as={React.Fragment}>
                  <button
                    ref={setReferenceElement}
                    type="button"
                    className={`flex items-center justify-between gap-1 rounded-md px-2.5 py-1 text-xs whitespace-nowrap duration-300 ${
                      open
                        ? "bg-custom-background-90 text-custom-text-100"
                        : "text-custom-text-200"
                    } ${
                      noBorder
                        ? ""
                        : "border border-custom-border-300 shadow-sm focus:outline-none"
                    } ${
                      disabled
                        ? "cursor-not-allowed text-custom-text-200"
                        : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
                  >
                    {label}
                    {!noChevron && <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </Menu.Button>
              )}
            </>
          )}
          <Menu.Items className="fixed z-10">
            <div
              className={`overflow-y-scroll whitespace-nowrap rounded-md border border-custom-border-300 p-1 text-xs shadow-custom-shadow-rg focus:outline-none bg-custom-background-90 my-1 ${
                maxHeight === "lg"
                  ? "max-h-60"
                  : maxHeight === "md"
                  ? "max-h-48"
                  : maxHeight === "rg"
                  ? "max-h-36"
                  : maxHeight === "sm"
                  ? "max-h-28"
                  : ""
              } ${
                width === "auto" ? "min-w-[8rem] whitespace-nowrap" : width
              } ${optionsClassName}`}
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              {children}
            </div>
          </Menu.Items>
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
          className={`w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${
            active ? "bg-custom-background-80" : ""
          } ${className}`}
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
