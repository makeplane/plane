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
  width?: "sm" | "md" | "lg" | "xl" | "auto";
  textAlignment?: "left" | "center" | "right";
  noBorder?: boolean;
  optionsPosition?: "left" | "right";
};

type MenuItemProps = {
  children: JSX.Element | string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: () => void;
  className?: string;
};

const CustomMenu = ({
  children,
  label,
  className = "",
  ellipsis = false,
  width = "auto",
  textAlignment,
  noBorder = false,
  optionsPosition = "right",
}: Props) => (
  <Menu as="div" className={`relative w-min whitespace-nowrap text-left ${className}`}>
    <div>
      {ellipsis ? (
        <Menu.Button className="relative grid place-items-center rounded p-1 hover:bg-gray-100 focus:outline-none">
          <EllipsisHorizontalIcon className="h-4 w-4" />
        </Menu.Button>
      ) : (
        <Menu.Button
          className={`flex cursor-pointer items-center justify-between gap-1 px-2 py-1 text-xs duration-300 hover:bg-gray-100 ${
            textAlignment === "right"
              ? "text-right"
              : textAlignment === "center"
              ? "text-center"
              : "text-left"
          } ${
            noBorder
              ? "rounded"
              : "rounded-md border shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          {!noBorder && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
        </Menu.Button>
      )}
    </div>

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
        className={`absolute z-20 mt-1 whitespace-nowrap rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
          optionsPosition === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
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
  </Menu>
);

const MenuItem: React.FC<MenuItemProps> = ({
  children,
  renderAs,
  href,
  onClick,
  className = "",
}) => (
  <Menu.Item>
    {({ active, close }) =>
      renderAs === "a" ? (
        <Link href={href ?? ""}>
          <a
            className={`${className} block p-2 text-gray-700 hover:bg-indigo-50 hover:text-gray-900`}
            onClick={close}
          >
            {children}
          </a>
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={`block w-full p-2 text-left ${
            active ? "bg-indigo-50 text-gray-900" : "text-gray-700"
          } ${className}`}
        >
          {children}
        </button>
      )
    }
  </Menu.Item>
);

CustomMenu.MenuItem = MenuItem;

export { CustomMenu };
