/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { MailboxService } from "@plane/services";
import { Input } from "@plane/ui";

type Props = {
  isOpen: boolean;
  defaultDomain?: string;
  handleClose: () => void;
  onSuccess: () => void;
};

const mailboxService = new MailboxService();

export function AliasModal(props: Props) {
  const { isOpen, defaultDomain, handleClose, onSuccess } = props;

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSource(defaultDomain ? `@${defaultDomain}` : "");
      setDestination("");
      setIsLoading(false);
    }
  }, [isOpen, defaultDomain]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await mailboxService.createAlias({ source: source.trim(), destination: destination.trim() });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Алиас создан" });
      onSuccess();
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Ошибка",
        message: error?.error || "Не удалось создать алиас",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = source.includes("@") && destination.includes("@");

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
              <Dialog.Panel className="relative w-full transform rounded-lg bg-surface-1 p-5 px-4 text-left shadow-raised-200 transition-all sm:max-w-xl">
                <h3 className="text-16 leading-6 font-medium text-primary">Создать алиас</h3>
                <div className="flex flex-col gap-4 pt-6 pb-2">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-13 text-tertiary">Адрес-источник</h4>
                    <Input
                      id="alias_source"
                      type="email"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="info@example.com"
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-13 text-tertiary">Пересылать на</h4>
                    <Input
                      id="alias_destination"
                      type="email"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Button variant="secondary" size="lg" onClick={handleClose}>
                      Отмена
                    </Button>
                    <Button variant="primary" size="lg" loading={isLoading} disabled={!isValid} onClick={handleSubmit}>
                      Создать
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
