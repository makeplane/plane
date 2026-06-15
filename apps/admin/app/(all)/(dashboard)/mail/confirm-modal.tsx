/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// gizmo imports
import { Button } from "@plane/propel/button";

type Props = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  handleClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmModal(props: Props) {
  const { isOpen, title, description, confirmLabel = "Удалить", handleClose, onConfirm } = props;
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="my-10 flex justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full transform rounded-lg bg-surface-1 p-5 px-4 text-left shadow-raised-200 transition-all sm:max-w-lg">
                <h3 className="text-16 leading-6 font-medium text-primary">{title}</h3>
                <div className="pt-4 pb-2">
                  <p className="text-13 text-secondary">{description}</p>
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <Button variant="secondary" size="lg" onClick={handleClose}>
                      Отмена
                    </Button>
                    <Button variant="error-fill" size="lg" loading={isLoading} onClick={handleConfirm}>
                      {confirmLabel}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
