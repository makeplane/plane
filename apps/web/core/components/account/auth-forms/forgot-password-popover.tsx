/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState } from "react";
import { Popover } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseOutline } from "@makeplane/propel/icons";
import { DropdownPanel } from "@plane/ui";

export function ForgotPasswordPopover() {
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  // plane hooks
  const { t } = useTranslation();

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <Popover.Button as={Fragment}>
            <button
              type="button"
              ref={setReferenceElement}
              className="text-11 font-medium text-accent-primary outline-none"
            >
              {t("auth.common.forgot_password")}
            </button>
          </Popover.Button>
          <DropdownPanel open={open} reference={referenceElement} placement="right-start" sideOffset={12}>
            <Popover.Panel
              static
              className="flex w-64 items-start gap-3 rounded-sm border border-strong bg-surface-1 px-2 py-1 text-left break-words"
            >
              <span className="flex-shrink-0">🤥</span>
              <p className="text-11">{t("auth.forgot_password.errors.smtp_not_enabled")}</p>
              <button
                type="button"
                className="grid size-3 flex-shrink-0 place-items-center"
                onClick={() => close()}
                aria-label={t("aria_labels.auth_forms.close_popover")}
              >
                <CloseOutline className="size-3 text-secondary" />
              </button>
            </Popover.Panel>
          </DropdownPanel>
        </>
      )}
    </Popover>
  );
}
