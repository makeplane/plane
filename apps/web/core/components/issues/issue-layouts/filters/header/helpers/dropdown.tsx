"use client";

import React, { Fragment, useState } from "react";
import { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
// icons
import { ChevronUp } from "lucide-react";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";

type Props = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  miniIcon?: React.ReactNode;
  title?: string;
  placement?: Placement;
  disabled?: boolean;
  tabIndex?: number;
  menuButton?: React.ReactNode;
  isFiltersApplied?: boolean;
};

export const FiltersDropdown: React.FC<Props> = (props) => {
  const {
    children,
    miniIcon,
    icon,
    title = "Dropdown",
    placement,
    disabled = false,
    tabIndex,
    menuButton,
    isFiltersApplied = false,
  } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });

  return (
    <Popover as="div">
      {({ open }) => {
        if (open) {
        }
        return (
          <>
            <Popover.Button as={React.Fragment}>
              {menuButton ? (
                <button role="button" ref={setReferenceElement}>
                  {menuButton}
                </button>
              ) : (
                <div ref={setReferenceElement}>
                  <div className="hidden @4xl:flex">
                    <Button
                      disabled={disabled}
                      variant="neutral-primary"
                      size="sm"
                      prependIcon={icon}
                      appendIcon={
                        <ChevronUp className={`transition-all ${open ? "" : "rotate-180"}`} size={14} strokeWidth={2} />
                      }
                      tabIndex={tabIndex}
                      className="relative"
                    >
                      <>
                        <div className={`${open ? "text-custom-text-100" : "text-custom-text-200"}`}>
                          <span>{title}</span>
                        </div>
                        {isFiltersApplied && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-custom-primary-100 text-[10px] font-medium text-white">
                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </>
                    </Button>
                  </div>
                  <div className="flex @4xl:hidden">
                    <Button
                      disabled={disabled}
                      ref={setReferenceElement}
                      variant="neutral-primary"
                      size="sm"
                      tabIndex={tabIndex}
                      className="relative px-2"
                    >
                      {miniIcon || title}
                    </Button>
                  </div>
                </div>
              )}
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              {/** translate-y-0 is a hack to create new stacking context. Required for safari  */}
              <Popover.Panel className="fixed z-10 translate-y-0">
                <div
                  className="overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg my-1"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <div className="flex max-h-[30rem] lg:max-h-[37.5rem] w-[18.75rem] flex-col overflow-hidden">
                    {children}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
};
