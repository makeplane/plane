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
  optionsPosition?: "left" | "right";
  customButton?: JSX.Element;
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
  optionsPosition = "right",
  customButton,
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
                className="relative grid place-items-center rounded p-1 hover:bg-brand-surface-2 focus:outline-none"
              >
                <EllipsisHorizontalIcon
                  className={`h-4 w-4 ${verticalEllipsis ? "rotate-90" : ""}`}
                />
              </Menu.Button>
            ) : (
              <Menu.Button
                type="button"
                className={`flex cursor-pointer items-center justify-between gap-1 px-2.5 py-1 text-xs duration-300 hover:bg-brand-surface-2 ${
                  open ? "bg-brand-surface-1 text-brand-base" : "text-brand-secondary"
                } ${
                  textAlignment === "right"
                    ? "text-right"
                    : textAlignment === "center"
                    ? "text-center"
                    : "text-left"
                } ${
                  noBorder
                    ? "rounded-md"
                    : "rounded-md border border-brand-base shadow-sm focus:outline-none"
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
            className={`absolute z-20 mt-1 overflow-y-scroll whitespace-nowrap rounded-md border border-brand-base bg-brand-surface-1 p-1 text-xs shadow-lg focus:outline-none ${
              optionsPosition === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
            } ${
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
            }`}
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
              active ? "bg-brand-surface-2" : ""
            } hover:text-brand-muted-1 inline-block w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-brand-secondary hover:bg-brand-surface-2`}
            onClick={close}
          >
            {children}
          </a>
        </Link>
      ) : (
        <button
          type="button"
          className={`${className} ${
            active ? "bg-brand-surface-2" : ""
          } hover:text-brand-muted-1 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-brand-secondary hover:bg-brand-surface-2`}
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
