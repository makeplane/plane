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
  height?: "sm" | "md" | "rg" | "lg";
};

export const MultiLevelDropdown: React.FC<MultiLevelDropdownProps> = ({
  label,
  options,
  onSelect,
  direction = "right",
  height = "md",
}) => {
  const [openChildFor, setOpenChildFor] = useState<string | null>(null);

  return (
    <Menu as="div" className="relative z-10 inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              onClick={() => setOpenChildFor(null)}
              className={`group flex items-center justify-between gap-2 rounded-md border border-brand-base px-3 py-1.5 text-xs shadow-sm duration-300 focus:outline-none ${
                open ? "bg-brand-surface-1 text-brand-base" : "text-brand-secondary"
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
              className="absolute right-0 z-10 mt-1 w-36 origin-top-right select-none rounded-md bg-brand-surface-2 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
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
                            active || option.selected ? "bg-brand-surface-1" : ""
                          } flex items-center gap-1 rounded px-1 py-1.5 text-brand-secondary ${
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
                    <div
                      className={`absolute top-0 w-36 origin-top-right select-none overflow-y-scroll rounded-md bg-brand-surface-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                        direction === "left"
                          ? "right-full -translate-x-1"
                          : "left-full translate-x-1"
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
                      }`}
                    >
                      <div className="space-y-1 p-1">
                        {option.children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              onSelect(child.value);
                            }}
                            className={`${
                              child.selected ? "bg-brand-surface-1" : ""
                            } flex w-full items-center break-all rounded px-1 py-1.5 text-left capitalize text-brand-secondary hover:bg-brand-surface-1`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
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
