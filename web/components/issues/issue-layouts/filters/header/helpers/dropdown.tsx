import React, { Fragment, useState } from "react";
import { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
import { ChevronUp } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
// icons

type Props = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  placement?: Placement;
  disabled?: boolean;
  tabIndex?: number;
  menuButton?: React.ReactNode;
};

export const FiltersDropdown: React.FC<Props> = (props) => {
  const { children, icon, title = "Dropdown", placement, disabled = false, tabIndex, menuButton } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
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
                <Button
                  disabled={disabled}
                  ref={setReferenceElement}
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={icon}
                  appendIcon={
                    <ChevronUp className={`transition-all ${open ? "" : "rotate-180"}`} size={14} strokeWidth={2} />
                  }
                  tabIndex={tabIndex}
                >
                  <div className={`${open ? "text-custom-text-100" : "text-custom-text-200"}`}>
                    <span>{title}</span>
                  </div>
                </Button>
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
              <Popover.Panel className="fixed z-10">
                <div
                  className="overflow-hidden rounded border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-rg my-1"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <div className="flex max-h-[37.5rem] w-[18.75rem] flex-col overflow-hidden">{children}</div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
};
