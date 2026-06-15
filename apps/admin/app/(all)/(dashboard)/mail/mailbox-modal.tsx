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
import type { TMailbox } from "@plane/types";
import { Input } from "@plane/ui";

type Props = {
  isOpen: boolean;
  // When set, the modal resets the password for this mailbox; otherwise it
  // creates a new mailbox.
  mailbox?: TMailbox | null;
  // Default domain to suggest in the email field (local-part@<domain>).
  defaultDomain?: string;
  handleClose: () => void;
  onSuccess: () => void;
};

const mailboxService = new MailboxService();

export function MailboxModal(props: Props) {
  const { isOpen, mailbox, defaultDomain, handleClose, onSuccess } = props;
  const isResetMode = Boolean(mailbox);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [quota, setQuota] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultDomain ? `@${defaultDomain}` : "");
      setPassword("");
      setQuota("0");
      setIsLoading(false);
    }
  }, [isOpen, defaultDomain]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (isResetMode && mailbox) {
        await mailboxService.update(mailbox.id, { password });
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Пароль обновлён" });
      } else {
        await mailboxService.create({ email: email.trim(), password, quota_mb: Number(quota) || 0 });
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Ящик создан" });
      }
      onSuccess();
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Ошибка",
        message: error?.error || "Не удалось сохранить ящик",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = (isResetMode || email.includes("@")) && password.length > 0;

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
                <h3 className="text-16 leading-6 font-medium text-primary">
                  {isResetMode ? `Сбросить пароль — ${mailbox?.email}` : "Создать почтовый ящик"}
                </h3>
                <div className="flex flex-col gap-4 pt-6 pb-2">
                  {!isResetMode && (
                    <div className="flex flex-col gap-1">
                      <h4 className="text-13 text-tertiary">Адрес ящика</h4>
                      <Input
                        id="mailbox_email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <h4 className="text-13 text-tertiary">Пароль</h4>
                    <Input
                      id="mailbox_password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль ящика"
                      className="w-full"
                    />
                  </div>
                  {!isResetMode && (
                    <div className="flex flex-col gap-1">
                      <h4 className="text-13 text-tertiary">Квота, МБ (0 — без ограничения)</h4>
                      <Input
                        id="mailbox_quota"
                        type="number"
                        value={quota}
                        onChange={(e) => setQuota(e.target.value)}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Button variant="secondary" size="lg" onClick={handleClose}>
                      Отмена
                    </Button>
                    <Button variant="primary" size="lg" loading={isLoading} disabled={!isValid} onClick={handleSubmit}>
                      {isResetMode ? "Сбросить пароль" : "Создать"}
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
