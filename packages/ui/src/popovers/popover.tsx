import React, { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import { Popover as HeadlessReactPopover, Transition } from "@headlessui/react";
// helpers
import { cn } from "../../helpers";
// types
import { TPopover } from "./types";
import { EllipsisVertical } from "lucide-react";

export const Popover = (props: TPopover) => {
  const {
    popperPosition = "bottom-end",
    popperPadding = 0,
    buttonClassName = "",
    button,
    panelClassName = "",
    children,
  } = props;
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  // react-popper derived values
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: popperPosition,
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: popperPadding,
        },
      },
    ],
  });

  return (
    <HeadlessReactPopover className="relative flex h-full w-full items-center justify-center">
      <HeadlessReactPopover.Button ref={setReferenceElement} className="flex justify-center items-center">
        {button ? (
          button
        ) : (
          <div
            className={cn(
              "flex justify-center items-center text-base h-6 w-6 rounded transition-all bg-custom-background-90 hover:bg-custom-background-80",
              buttonClassName
            )}
          >
            <EllipsisVertical className="h-3 w-3" />
          </div>
        )}
      </HeadlessReactPopover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <HeadlessReactPopover.Panel
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={cn("absolute left-0 top-full z-20 w-screen max-w-xs mt-2", panelClassName)}
        >
          {children}
        </HeadlessReactPopover.Panel>
      </Transition>
    </HeadlessReactPopover>
  );
};
