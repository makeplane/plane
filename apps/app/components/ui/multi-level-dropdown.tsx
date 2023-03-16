import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";

type MultiLevelDropdownProps = {
  label: string;
  options: {
    id: string;
    label: string;
    value: any;
    selected?: boolean;
    children?: {
      id: string;
      label: string;
      value: any;
      selected?: boolean;
    }[];
  }[];
  onSelect: (value: any) => void;
  direction?: "left" | "right";
};

export const MultiLevelDropdown: React.FC<MultiLevelDropdownProps> = (props) => {
  const { label, options, onSelect, direction = "right" } = props;

  const [openChildFor, setOpenChildFor] = useState<string | null>(null);

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              onClick={() => {
                setOpenChildFor(null);
              }}
              className={`group flex items-center gap-2 rounded-md border bg-transparent p-2 text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none ${
                open ? "bg-gray-100 text-gray-900" : "text-gray-500"
              }`}
            >
              {label}
              <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
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
              className="absolute right-0 mt-2 w-36 origin-top-right select-none divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              {options.map((option) => (
                <div className="relative px-1 py-1" key={option.id}>
                  <Menu.Item
                    as="button"
                    onClick={(e: any) => {
                      if (option.children) {
                        if (openChildFor === option.id) {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenChildFor(null);
                        } else {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenChildFor(option.id);
                        }
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
                          } group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm`}
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
                      className={`absolute top-0 mt-2 w-36 origin-top-right select-none divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                        direction === "left"
                          ? "right-full -translate-x-2"
                          : "left-full translate-x-2"
                      }`}
                    >
                      {option.children.map((child) => (
                        <div className="relative px-1 py-1" key={child.id}>
                          <Menu.Item as="div" className="flex items-center justify-between">
                            {({ active }) => (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelect(child.value);
                                  }}
                                  className={`${
                                    active || option.selected ? "bg-gray-100" : "text-gray-900"
                                  } group flex w-full items-center rounded-md px-2 py-2 text-sm capitalize`}
                                >
                                  {child.label}
                                </button>
                              </>
                            )}
                          </Menu.Item>
                        </div>
                      ))}
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
