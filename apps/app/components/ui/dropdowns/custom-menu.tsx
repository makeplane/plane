import React from "react";

import Link from "next/link";

// headless ui
import { Menu, Transition } from "@headlessui/react";
// icons
import { DropdownProps, Icon } from "components/ui";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export type CustomMenuProps = DropdownProps & {
  children: React.ReactNode;
  ellipsis?: boolean;
  noBorder?: boolean;
  verticalEllipsis?: boolean;
};

const CustomMenu = ({
  buttonClassName = "",
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
}: CustomMenuProps) => (
  <Menu as="div" className={`${selfPositioned ? "" : "relative"} w-min text-left ${className}`}>
    {({ open }) => (
      <>
        {customButton ? (
          <Menu.Button as="div">{customButton}</Menu.Button>
        ) : (
          <>
            {ellipsis || verticalEllipsis ? (
              <Menu.Button
                type="button"
                disabled={disabled}
                className={`relative grid place-items-center rounded p-1 text-custom-text-200 outline-none ${
                  disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
                } ${buttonClassName}`}
              >
                <Icon
                  iconName="more_horiz"
                  className={`${verticalEllipsis ? "rotate-90" : ""} text-custom-text-200`}
                />
              </Menu.Button>
            ) : (
              <Menu.Button
                type="button"
                className={`flex items-center justify-between gap-1 rounded-md px-2.5 py-1 text-xs whitespace-nowrap duration-300 ${
                  open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                } ${
                  noBorder ? "" : "border border-custom-border-100 shadow-sm focus:outline-none"
                } ${
                  disabled
                    ? "cursor-not-allowed text-custom-text-200"
                    : "cursor-pointer hover:bg-custom-background-80"
                } ${buttonClassName}`}
              >
                {label}
                {!noChevron && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
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
            className={`absolute z-10 overflow-y-scroll whitespace-nowrap rounded-md border border-custom-border-100 p-1 text-xs shadow-lg focus:outline-none bg-custom-background-90 ${
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
