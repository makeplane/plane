import React from "react";
// next
import Link from "next/link";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
// commons
import { classNames } from "constants/common";
// types
import type { MenuItemProps, Props } from "./types";

const CustomMenu = ({ children, label, textAlignment }: Props) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          className={`inline-flex w-32 justify-between gap-x-4 rounded-md border border-gray-300 bg-white px-4 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 ${
            textAlignment === "right"
              ? "text-right"
              : textAlignment === "center"
              ? "text-center"
              : "text-left"
          }`}
        >
          <span className="truncate w-20">{label}</span>
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </Menu.Button>
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ children, renderAs, href, onClick }) => {
  return (
    <Menu.Item>
      {({ active }) =>
        renderAs === "a" ? (
          <Link href={href ?? ""}>
            <a
              className={classNames(
                active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                "block px-4 py-2 text-sm"
              )}
            >
              {children}
            </a>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className={classNames(
              active ? "bg-gray-100 text-gray-900" : "text-gray-700",
              "block w-full px-4 py-2 text-left text-sm"
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
