import React from "react";
// next
import Link from "next/link";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
// types
import type { MenuItemProps, Props } from "./types";
// constants
import { classNames } from "constants/common";

const CustomMenu = ({
  children,
  label,
  className = "",
  ellipsis = false,
  width = "auto",
  textAlignment,
  withoutBorder = false,
  optionsPosition = "right",
}: Props) => {
  return (
    <Menu as="div" className={`relative w-min whitespace-nowrap text-left ${className}`}>
      <div>
        {ellipsis ? (
          <Menu.Button className="grid relative place-items-center hover:bg-gray-100 rounded p-1 focus:outline-none">
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </Menu.Button>
        ) : (
          <Menu.Button
            className={`flex justify-between items-center gap-1 hover:bg-gray-100 px-2 py-1 cursor-pointer text-xs duration-300 ${
              textAlignment === "right"
                ? "text-right"
                : textAlignment === "center"
                ? "text-center"
                : "text-left"
            } ${
              withoutBorder
                ? "rounded"
                : "w-full border shadow-sm rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            }`}
          >
            {label}
            {!withoutBorder && <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />}
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
          className={`absolute z-20 mt-1 rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
            optionsPosition === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
          } ${width === "auto" ? "min-w-full whitespace-nowrap" : "w-56"}`}
        >
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ children, renderAs, href, onClick }) => {
  return (
    <Menu.Item>
      {({ active, close }) =>
        renderAs === "a" ? (
          <Link href={href ?? ""}>
            <a
              className="block p-2 text-gray-700 hover:bg-indigo-50 hover:text-gray-900"
              onClick={close}
            >
              {children}
            </a>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className={classNames(
              active ? "bg-indigo-50 text-gray-900" : "text-gray-700",
              "block w-full p-2 text-left"
            )}
          >
            {children}
          </button>
        )
      }
    </Menu.Item>
  );
};

CustomMenu.MenuItem = MenuItem;

export default CustomMenu;
