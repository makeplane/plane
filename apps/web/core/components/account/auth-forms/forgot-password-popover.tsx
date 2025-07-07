import { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import { X } from "lucide-react";
import { Popover } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";

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
  // plane hooks
  const { t } = useTranslation();

  return (
    <Popover className="relative">
      <Popover.Button as={Fragment}>
        <button
          type="button"
          ref={setReferenceElement}
          className="text-xs font-medium text-custom-primary-100 outline-none"
        >
          {t("auth.common.forgot_password")}
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
            <p className="text-xs">{t("auth.forgot_password.errors.smtp_not_enabled")}</p>
            <button
              type="button"
              className="flex-shrink-0 size-3 grid place-items-center"
              onClick={() => close()}
              aria-label={t("aria_labels.auth_forms.close_popover")}
            >
              <X className="size-3 text-onboarding-text-200" />
            </button>
          </div>
        )}
      </Popover.Panel>
    </Popover>
  );
};
