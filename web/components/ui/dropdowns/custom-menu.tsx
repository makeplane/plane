import React from "react";

import Link from "next/link";

// headless ui
import { Menu, Transition } from "@headlessui/react";
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
  position = "right",
  selfPositioned = false,
  verticalEllipsis = false,
  verticalPosition = "bottom",
  width = "auto",
  menuButtonOnClick,
}: CustomMenuProps) => (
  <Menu as="div" className={`${selfPositioned ? "" : "relative"} w-min text-left ${className}`}>
    {({ open }) => (
      <>
        {customButton ? (
          <Menu.Button
            as="button"
            type="button"
            onClick={menuButtonOnClick}
            className={customButtonClassName}
            disabled={disabled}
          >
            {customButton}
          </Menu.Button>
        ) : (
          <>
            {ellipsis || verticalEllipsis ? (
              <Menu.Button
                type="button"
                onClick={menuButtonOnClick}
                disabled={disabled}
                className={`relative grid place-items-center rounded p-1 text-custom-text-200 hover:text-custom-text-100 outline-none ${
                  disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
                } ${buttonClassName}`}
              >
                <MoreHorizOutlined
                  fontSize="small"
                  className={verticalEllipsis ? "rotate-90" : ""}
                />
              </Menu.Button>
            ) : (
              <Menu.Button
                type="button"
                className={`flex items-center justify-between gap-1 rounded-md px-2.5 py-1 text-xs whitespace-nowrap duration-300 ${
                  open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                } ${
                  noBorder ? "" : "border border-custom-border-300 shadow-sm focus:outline-none"
                } ${
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
              </Menu.Button>
            )}
          </>
        )}

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            className={`absolute z-10 overflow-y-scroll whitespace-nowrap rounded-md border border-custom-border-300 p-1 text-xs shadow-lg focus:outline-none bg-custom-background-90 ${
              position === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
            } ${verticalPosition === "top" ? "bottom-full mb-1" : "mt-1"} ${
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
          >
            <div className="py-1">{children}</div>
          </Menu.Items>
        </Transition>
      </>
    )}
  </Menu>
);

type MenuItemProps = {
  children: React.ReactNode;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: (args?: any) => void;
  className?: string;
};

const MenuItem: React.FC<MenuItemProps> = ({
  children,
  renderAs,
  href,
  onClick,
  className = "",
}) => (
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
