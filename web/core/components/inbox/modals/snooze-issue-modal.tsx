"use client";

import { FC, Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button, Calendar } from "@plane/ui";

export type InboxIssueSnoozeModalProps = {
  isOpen: boolean;
  value: Date | undefined;
  onConfirm: (value: Date) => void;
  handleClose: () => void;
};

export const InboxIssueSnoozeModal: FC<InboxIssueSnoozeModalProps> = (props) => {
  const { isOpen, handleClose, value, onConfirm } = props;
  // states
  const [date, setDate] = useState(value || new Date());
  //hooks
  const { t } = useTranslation();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-20 flex w-full justify-center overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex transform rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="flex h-full w-full flex-col gap-y-1">
                  <Calendar
                    captionLayout="dropdown"
                    classNames={{ root: `rounded-md border border-custom-border-200 p-3` }}
                    selected={date ? new Date(date) : undefined}
                    defaultMonth={date ? new Date(date) : undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      setDate(date);
                    }}
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                  />
                  <Button
                    variant="primary"
                    onClick={() => {
                      close();
                      onConfirm(date);
                    }}
                  >
                    {t("inbox_issue.actions.snooze")}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
