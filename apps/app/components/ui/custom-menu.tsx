import React from "react";
// next
import Link from "next/link";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

type Props = {
  children: React.ReactNode;
  label?: string | JSX.Element;
  className?: string;
  ellipsis?: boolean;
  verticalEllipsis?: boolean;
  height?: "sm" | "md" | "rg" | "lg";
  width?: "sm" | "md" | "lg" | "xl" | "auto";
  textAlignment?: "left" | "center" | "right";
  noBorder?: boolean;
  noChevron?: boolean;
  position?: "left" | "right";
  verticalPosition?: "top" | "bottom";
  menuItemsClassName?: string;
  customButton?: JSX.Element;
  menuItemsWhiteBg?: boolean;
};

type MenuItemProps = {
  children: JSX.Element | string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: (args?: any) => void;
  className?: string;
};

const CustomMenu = ({
  children,
  label,
  className = "",
  ellipsis = false,
  verticalEllipsis = false,
  height = "md",
  width = "auto",
  textAlignment,
  noBorder = false,
  noChevron = false,
  position = "right",
  verticalPosition = "bottom",
  menuItemsClassName = "",
  customButton,
  menuItemsWhiteBg = false,
}: Props) => (
  <Menu as="div" className={`relative w-min whitespace-nowrap text-left ${className}`}>
    {({ open }) => (
      <>
        {customButton ? (
          <Menu.Button as="div">{customButton}</Menu.Button>
        ) : (
          <div>
            {ellipsis || verticalEllipsis ? (
              <Menu.Button
                type="button"
                className="relative grid place-items-center rounded p-1 text-custom-text-200 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none"
              >
                <EllipsisHorizontalIcon
                  className={`h-4 w-4 ${verticalEllipsis ? "rotate-90" : ""}`}
                />
              </Menu.Button>
            ) : (
              <Menu.Button
                type="button"
                className={`flex cursor-pointer items-center justify-between gap-1 px-2.5 py-1 text-xs duration-300 hover:bg-custom-background-80 ${
                  open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                } ${
                  textAlignment === "right"
                    ? "text-right"
                    : textAlignment === "center"
                    ? "text-center"
                    : "text-left"
                } ${
                  noBorder
                    ? "rounded-md"
                    : "rounded-md border border-custom-border-100 shadow-sm focus:outline-none"
                } ${
                  width === "sm"
                    ? "w-10"
                    : width === "md"
                    ? "w-20"
                    : width === "lg"
                    ? "w-32"
                    : width === "xl"
                    ? "w-48"
                    : "w-full"
                }`}
              >
                {label}
                {!noChevron && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
              </Menu.Button>
            )}
          </div>
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
            className={`absolute z-20 overflow-y-scroll whitespace-nowrap rounded-md border p-1 text-xs shadow-lg focus:outline-none ${
              position === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
            } ${verticalPosition === "top" ? "bottom-full mb-1" : "mt-1"} ${
              height === "sm"
                ? "max-h-28"
                : height === "md"
                ? "max-h-44"
                : height === "rg"
                ? "max-h-56"
                : height === "lg"
                ? "max-h-80"
                : ""
            } ${
              width === "sm"
                ? "w-10"
                : width === "md"
                ? "w-20"
                : width === "lg"
                ? "w-32"
                : width === "xl"
                ? "w-48"
                : "min-w-full"
            } ${
              menuItemsWhiteBg
                ? "border-custom-border-200 bg-custom-background-100"
                : "border-custom-border-100 bg-custom-background-90"
            } ${menuItemsClassName}`}
          >
            <div className="py-1">{children}</div>
          </Menu.Items>
        </Transition>
      </>
    )}
  </Menu>
);

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
            className={`${className} ${
              active ? "bg-custom-background-80" : ""
            } hover:text-custom-text-200 inline-block w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80`}
            onClick={close}
          >
            {children}
          </a>
        </Link>
      ) : (
        <button
          type="button"
          className={`${className} ${
            active ? "bg-custom-background-80" : ""
          } hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80`}
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
