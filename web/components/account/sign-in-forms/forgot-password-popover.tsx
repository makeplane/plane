import { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
import { X } from "lucide-react";

export const ForgotPasswordPopover = () => {
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  return (
    <Popover className="relative">
      <Popover.Button as={Fragment}>
        <button
          type="button"
          ref={setReferenceElement}
          className="text-xs font-medium text-custom-primary-100 outline-none"
        >
          Forgot your password?
        </button>
      </Popover.Button>
      <Popover.Panel className="fixed z-10">
        {({ close }) => (
          <div
            className="border border-onboarding-border-300 bg-onboarding-background-100 rounded z-10 py-1 px-2 w-64 break-words flex items-start gap-3 text-left ml-3"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <span className="flex-shrink-0">🤥</span>
            <p className="text-xs">
              We see that your god hasn{"'"}t enabled SMTP, we will not be able to send a password reset link
            </p>
            <button type="button" className="flex-shrink-0" onClick={() => close()}>
              <X className="h-3 w-3 text-onboarding-text-200" />
            </button>
          </div>
        )}
      </Popover.Panel>
    </Popover>
  );
};
