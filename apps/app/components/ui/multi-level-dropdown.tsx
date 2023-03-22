import { Fragment, useState } from "react";

// headless ui
import { Menu, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";

type MultiLevelDropdownProps = {
  label: string;
  options: {
    id: string;
    label: string;
    value: any;
    selected?: boolean;
    children?: {
      id: string;
      label: string | JSX.Element;
      value: any;
      selected?: boolean;
    }[];
  }[];
  onSelect: (value: any) => void;
  direction?: "left" | "right";
};

export const MultiLevelDropdown: React.FC<MultiLevelDropdownProps> = ({
  label,
  options,
  onSelect,
  direction = "right",
}) => {
  const [openChildFor, setOpenChildFor] = useState<string | null>(null);

  return (
    <Menu as="div" className="relative z-10 inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              onClick={() => setOpenChildFor(null)}
              className={`group flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-xs shadow-sm duration-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                open ? "bg-gray-100 text-gray-900" : "text-gray-500"
              }`}
            >
              {label}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              static
              className="absolute right-0 mt-1 w-36 origin-top-right select-none rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              {options.map((option) => (
                <div className="relative p-1" key={option.id}>
                  <Menu.Item
                    as="button"
                    onClick={(e: any) => {
                      if (option.children) {
                        e.stopPropagation();
                        e.preventDefault();

                        if (openChildFor === option.id) setOpenChildFor(null);
                        else setOpenChildFor(option.id);
                      } else {
                        onSelect(option.value);
                      }
                    }}
                    className="w-full"
                  >
                    {({ active }) => (
                      <>
                        <div
                          className={`${
                            active || option.selected ? "bg-gray-100" : "text-gray-900"
                          } flex items-center gap-1 rounded px-1 py-1.5 ${
                            direction === "right" ? "justify-between" : ""
                          }`}
                        >
                          {direction === "left" && option.children && (
                            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>{option.label}</span>
                          {direction === "right" && option.children && (
                            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                      </>
                    )}
                  </Menu.Item>
                  {option.children && option.id === openChildFor && (
                    <Menu.Items
                      static
                      className={`absolute top-0 w-36 origin-top-right select-none rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                        direction === "left"
                          ? "right-full -translate-x-1"
                          : "left-full translate-x-1"
                      }`}
                    >
                      <div className="space-y-1 p-1">
                        {option.children.map((child) => (
                          <Menu.Item
                            key={child.id}
                            as="button"
                            type="button"
                            onClick={() => {
                              onSelect(child.value);
                            }}
                            className={({ active }) =>
                              `${
                                active || child.selected ? "bg-gray-100" : "text-gray-900"
                              } flex w-full items-center rounded px-1 py-1.5 capitalize`
                            }
                          >
                            {child.label}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  )}
                </div>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};
