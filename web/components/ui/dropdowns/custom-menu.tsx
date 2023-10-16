import React, { useState } from "react";

import Link from "next/link";

// react-poppper
import { usePopper } from "react-popper";
// headless ui
import { Menu } from "@headlessui/react";
// ui
import { DropdownProps } from "components/ui";
// icons
import { ExpandMoreOutlined, MoreHorizOutlined } from "@mui/icons-material";

export type CustomMenuProps = DropdownProps & {
  children: React.ReactNode;
  ellipsis?: boolean;
  noBorder?: boolean;
  verticalEllipsis?: boolean;
  menuButtonOnClick?: (...args: any) => void;
};

const CustomMenu = ({
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
}: CustomMenuProps) => {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
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
                      disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
                  >
                    <MoreHorizOutlined fontSize="small" className={verticalEllipsis ? "rotate-90" : ""} />
                  </button>
                </Menu.Button>
              ) : (
                <Menu.Button as={React.Fragment}>
                  <button
                    ref={setReferenceElement}
                    type="button"
                    className={`flex items-center justify-between gap-1 rounded-md px-2.5 py-1 text-xs whitespace-nowrap duration-300 ${
                      open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                    } ${noBorder ? "" : "border border-custom-border-300 shadow-sm focus:outline-none"} ${
                      disabled
                        ? "cursor-not-allowed text-custom-text-200"
                        : "cursor-pointer hover:bg-custom-background-80"
                    } ${buttonClassName}`}
                  >
                    {label}
                    {!noChevron && (
                      <ExpandMoreOutlined
                        sx={{
                          fontSize: 14,
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </Menu.Button>
              )}
            </>
          )}
          <Menu.Items>
            <div
              className={`z-10 overflow-y-scroll whitespace-nowrap rounded-md border border-custom-border-300 p-1 text-xs shadow-custom-shadow-rg focus:outline-none bg-custom-background-90 my-1 ${
                maxHeight === "lg"
                  ? "max-h-60"
                  : maxHeight === "md"
                  ? "max-h-48"
                  : maxHeight === "rg"
                  ? "max-h-36"
                  : maxHeight === "sm"
                  ? "max-h-28"
                  : ""
              } ${width === "auto" ? "min-w-[8rem] whitespace-nowrap" : width} ${optionsClassName}`}
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              <div className="py-1">{children}</div>
            </div>
          </Menu.Items>
        </>
      )}
    </Menu>
  );
};

type MenuItemProps = {
  children: React.ReactNode;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: (args?: any) => void;
  className?: string;
};

const MenuItem: React.FC<MenuItemProps> = ({ children, renderAs, href, onClick, className = "" }) => (
  <Menu.Item as="div">
    {({ active, close }) =>
      renderAs === "a" ? (
        <Link href={href ?? ""}>
          <a
            className={`inline-block w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${
              active ? "bg-custom-background-80" : ""
            } ${className}`}
            onClick={close}
          >
            {children}
          </a>
        </Link>
      ) : (
        <button
          type="button"
          className={`w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 ${
            active ? "bg-custom-background-80" : ""
          } ${className}`}
          onClick={onClick}
        >
          {children}
        </button>
      )
    }
  </Menu.Item>
);

CustomMenu.MenuItem = MenuItem;

export { CustomMenu };
