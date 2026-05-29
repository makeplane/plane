import React, { Fragment, useState } from "react";
import type { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/propel/button";

type Props = {
  children: React.ReactNode;
  title?: string;
  placement?: Placement;
};

export function FiltersDropdown(props: Props) {
  const { children, title = "Dropdown", placement } = props;

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
              <Button ref={setReferenceElement} variant="secondary">
                <div className={`${open ? "text-primary" : "text-secondary"}`}>
                  <span>{title}</span>
                </div>
              </Button>
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
              <Popover.Panel>
                <div
                  className="z-10 overflow-hidden rounded-sm border border-subtle bg-surface-1 shadow-raised-200"
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
}
