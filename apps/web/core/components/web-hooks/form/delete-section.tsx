"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { WORKSPACE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { Button } from "@plane/ui";

type Props = {
  openDeleteModal: () => void;
};

export const WebhookDeleteSection: React.FC<Props> = (props) => {
  const { openDeleteModal } = props;

  return (
    <Disclosure as="div" className="border-t border-custom-border-200">
      {({ open }) => (
        <div className="w-full">
          <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between py-4">
            <span className="text-lg tracking-tight">Danger zone</span>
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                <span className="text-sm tracking-tight">
                  Once a webhook is deleted, it cannot be restored. Future events will no longer be delivered to this
                  webhook.
                </span>
                <div>
                  <Button
                    variant="danger"
                    onClick={openDeleteModal}
                    data-ph-element={WORKSPACE_SETTINGS_TRACKER_ELEMENTS.WEBHOOK_DELETE_BUTTON}
                  >
                    Delete webhook
                  </Button>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};
