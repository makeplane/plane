import { Fragment, useState } from "react";

// headless ui
import { Menu, Transition } from "@headlessui/react";
// ui
import { Loader } from "@plane/ui";
// icons
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type MultiLevelDropdownProps = {
  label: string;
  options: {
    id: string;
    children?: {
      id: string;
      label: string | JSX.Element;
      value: any;
      selected?: boolean;
      element?: JSX.Element;
    }[];
    hasChildren: boolean;
    label: string;
    onClick?: () => void;
    selected?: boolean;
    value: any;
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
    <>
      <Menu as="div" className="relative z-10 inline-block text-left">
        {({ open }) => (
          <>
            <div>
              <Menu.Button
                onClick={() => setOpenChildFor(null)}
                className={`group flex items-center justify-between gap-2 rounded-md border border-custom-border-200 px-3 py-1.5 text-xs shadow-sm duration-300 hover:bg-custom-background-90 hover:text-custom-text-100 focus:outline-none ${
                  open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                {label}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
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
                className="absolute right-0 z-10 mt-1 w-36 origin-top-right select-none rounded-md border border-custom-border-300 bg-custom-background-90 text-xs shadow-lg focus:outline-none"
              >
                {options.map((option) => (
                  <div className="relative p-1" key={option.id}>
                    <Menu.Item
                      as="button"
                      onClick={(e: any) => {
                        if (option.hasChildren) {
                          e.stopPropagation();
                          e.preventDefault();

                          if (option.onClick) option.onClick();

                          if (openChildFor === option.id) setOpenChildFor(null);
                          else setOpenChildFor(option.id);
                        } else onSelect(option.value);
                      }}
                      className="w-full"
                    >
                      {({ active }) => (
                        <>
                          <div
                            className={`${
                              active || option.selected ? "bg-custom-background-80" : ""
                            } flex items-center gap-1 rounded px-1 py-1.5 text-custom-text-200 ${
                              direction === "right" ? "justify-between" : ""
                            }`}
                          >
                            {direction === "left" && option.hasChildren && <ChevronLeft className="h-3.5 w-3.5" />}
                            <span>{option.label}</span>
                            {direction === "right" && option.hasChildren && <ChevronRight className="h-3.5 w-3.5" />}
                          </div>
                        </>
                      )}
                    </Menu.Item>
                    {option.hasChildren && option.id === openChildFor && (
                      <div
                        className={`min-w-36 absolute top-0 origin-top-right select-none overflow-y-scroll whitespace-nowrap rounded-md border border-custom-border-300 bg-custom-background-90 shadow-lg focus:outline-none ${
                          direction === "left" ? "right-full -translate-x-1" : "left-full translate-x-1"
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
                        {option.children ? (
                          <div className="space-y-1 p-1">
                            {option.children.length === 0 ? (
                              <p className="px-1 py-1.5 text-center text-custom-text-200">No {option.label} found</p> //if no children found, show this message.
                            ) : (
                              option.children.map((child) => {
                                if (child.element) return child.element;
                                else
                                  return (
                                    <button
                                      key={child.id}
                                      type="button"
                                      onClick={() => onSelect(child.value)}
                                      className={`${
                                        child.selected ? "bg-custom-background-80" : ""
                                      } flex w-full items-center justify-between break-words rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80`}
                                    >
                                      {child.label}{" "}
                                      <Check
                                        className={`h-3.5 w-3.5 opacity-0 ${child.selected ? "opacity-100" : ""}`}
                                      />
                                    </button>
                                  );
                              })
                            )}
                          </div>
                        ) : (
                          <Loader className="space-y-2 p-1">
                            <Loader.Item height="20px" />
                            <Loader.Item height="20px" />
                            <Loader.Item height="20px" />
                            <Loader.Item height="20px" />
                          </Loader>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </>
  );
};
