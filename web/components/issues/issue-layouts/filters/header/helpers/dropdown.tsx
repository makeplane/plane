import React, { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";

// ui
import { Button } from "@plane/ui";
// icons
import { ChevronUp } from "lucide-react";

type Props = {
  children: React.ReactNode;
  title?: string;
};

export const FiltersDropdown: React.FC<Props> = (props) => {
  const { children, title = "Dropdown" } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
  });

  return (
    <Popover as="div">
      {({ open }) => {
        if (open) {
        }
        return (
          <>
            <Popover.Button as={React.Fragment}>
              <Button
                ref={setReferenceElement}
                variant="neutral-primary"
                size="sm"
                appendIcon={
                  <ChevronUp className={`transition-all ${open ? "" : "rotate-180"}`} size={14} strokeWidth={2} />
                }
              >
                <div className={`${open ? "text-custom-text-100" : "text-custom-text-200"}`}>
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
                  className="z-10 bg-custom-background-100 border border-custom-border-200 shadow-custom-shadow-rg rounded overflow-hidden"
                  ref={setPopperElement}
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <div className="w-[18.75rem] max-h-[37.5rem] flex flex-col overflow-hidden">{children}</div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
};
