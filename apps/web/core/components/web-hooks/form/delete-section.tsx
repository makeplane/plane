/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Disclosure, Transition } from "@headlessui/react";
import { WORKSPACE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon, ChevronUpIcon } from "@plane/propel/icons";

type Props = {
  openDeleteModal: () => void;
};

export function WebhookDeleteSection(props: Props) {
  const { openDeleteModal } = props;
  const { t } = useTranslation();

  return (
    <Disclosure as="div" className="border-t border-subtle">
      {({ open }) => (
        <div className="w-full">
          <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between py-4">
            <span className="text-16 tracking-tight">{t("common.danger_zone")}</span>
            {open ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
          </Disclosure.Button>

          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform opacity-0"
            enterTo="transform opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform opacity-100"
            leaveTo="transform opacity-0"
          >
            <Disclosure.Panel>
              <div className="flex flex-col gap-8">
                <span className="text-13 tracking-tight">
                  {t("workspace_settings.webhooks.delete.description")}
                </span>
                <div>
                  <Button
                    variant="error-fill"
                    size="lg"
                    onClick={openDeleteModal}
                    data-ph-element={WORKSPACE_SETTINGS_TRACKER_ELEMENTS.WEBHOOK_DELETE_BUTTON}
                  >
                    {t("workspace_settings.webhooks.delete.title")}
                  </Button>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
}
