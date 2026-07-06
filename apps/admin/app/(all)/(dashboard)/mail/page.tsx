/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { KeyRound, Plus, Trash2 } from "lucide-react";
// gizmo imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { MailboxService } from "@plane/services";
import type { TMailbox } from "@plane/types";
import { Loader, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// types
import type { Route } from "./+types/page";
// local
import { AliasModal } from "./alias-modal";
import { ConfirmModal } from "./confirm-modal";
import { MailboxModal } from "./mailbox-modal";

const mailboxService = new MailboxService();

type TTab = "mailboxes" | "aliases";

function MailPage(_props: Route.ComponentProps) {
  // tabs
  const [activeTab, setActiveTab] = useState<TTab>("mailboxes");
  // modals
  const [createMailboxOpen, setCreateMailboxOpen] = useState(false);
  const [resetMailbox, setResetMailbox] = useState<TMailbox | null>(null);
  const [deleteMailbox, setDeleteMailbox] = useState<TMailbox | null>(null);
  const [createAliasOpen, setCreateAliasOpen] = useState(false);
  const [deleteAliasId, setDeleteAliasId] = useState<string | null>(null);

  // data
  const { data: config } = useSWR("MAIL_CONFIG", () => mailboxService.config());
  const {
    data: mailboxes,
    isLoading: mailboxesLoading,
    mutate: mutateMailboxes,
  } = useSWR("MAILBOXES", () => mailboxService.list());
  const {
    data: aliases,
    isLoading: aliasesLoading,
    mutate: mutateAliases,
  } = useSWR("MAIL_ALIASES", () => mailboxService.listAliases());

  const handleToggleActive = async (mailbox: TMailbox) => {
    try {
      await mailboxService.update(mailbox.id, { is_active: !mailbox.is_active });
      mutateMailboxes();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Ошибка", message: "Не удалось обновить ящик" });
    }
  };

  const tabs: { key: TTab; label: string }[] = [
    { key: "mailboxes", label: "Ящики" },
    { key: "aliases", label: "Алиасы" },
  ];

  return (
    <PageWrapper
      header={{
        title: "Почтовый сервер",
        description:
          "Управляйте почтовыми ящиками и алиасами вашего собственного почтового сервера. " +
          (config?.mail_local
            ? "Локальный режим (без домена): подключайте клиент к localhost:993 (IMAP) и localhost:587 (SMTP)."
            : `Домен: ${config?.mail_domain ?? ""}.`),
      }}
    >
      <MailboxModal
        isOpen={createMailboxOpen}
        defaultDomain={config?.mail_domain}
        handleClose={() => setCreateMailboxOpen(false)}
        onSuccess={() => mutateMailboxes()}
      />
      <MailboxModal
        isOpen={Boolean(resetMailbox)}
        mailbox={resetMailbox}
        handleClose={() => setResetMailbox(null)}
        onSuccess={() => mutateMailboxes()}
      />
      <AliasModal
        isOpen={createAliasOpen}
        defaultDomain={config?.mail_domain}
        handleClose={() => setCreateAliasOpen(false)}
        onSuccess={() => mutateAliases()}
      />
      <ConfirmModal
        isOpen={Boolean(deleteMailbox)}
        title="Удалить ящик"
        description={`Ящик ${deleteMailbox?.email ?? ""} и вся его почта будут удалены без возможности восстановления.`}
        handleClose={() => setDeleteMailbox(null)}
        onConfirm={async () => {
          if (!deleteMailbox) return;
          await mailboxService.destroy(deleteMailbox.id);
          setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Ящик удалён" });
          mutateMailboxes();
        }}
      />
      <ConfirmModal
        isOpen={Boolean(deleteAliasId)}
        title="Удалить алиас"
        description="Алиас будет удалён."
        handleClose={() => setDeleteAliasId(null)}
        onConfirm={async () => {
          if (!deleteAliasId) return;
          await mailboxService.destroyAlias(deleteAliasId);
          setToast({ type: TOAST_TYPE.SUCCESS, title: "Готово", message: "Алиас удалён" });
          mutateAliases();
        }}
      />

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn("-mb-px border-b-2 px-4 py-2 text-13 transition-colors", {
              "border-primary text-primary": activeTab === tab.key,
              "border-transparent text-tertiary hover:text-secondary": activeTab !== tab.key,
            })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "mailboxes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" prependIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateMailboxOpen(true)}>
              Создать ящик
            </Button>
          </div>
          {mailboxesLoading ? (
            <Loader className="space-y-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : mailboxes && mailboxes.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-subtle">
              <table className="w-full text-13">
                <thead className="bg-layer-1 text-tertiary">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Адрес</th>
                    <th className="px-4 py-2 text-left font-medium">Квота</th>
                    <th className="px-4 py-2 text-left font-medium">Активен</th>
                    <th className="px-4 py-2 text-right font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {mailboxes.map((mailbox) => (
                    <tr key={mailbox.id} className="text-primary">
                      <td className="px-4 py-2">{mailbox.email}</td>
                      <td className="px-4 py-2 text-secondary">
                        {mailbox.quota_mb > 0 ? `${mailbox.quota_mb} МБ` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <ToggleSwitch value={mailbox.is_active} onChange={() => handleToggleActive(mailbox)} size="sm" />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Сбросить пароль"
                            className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-primary"
                            onClick={() => setResetMailbox(mailbox)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Удалить"
                            className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                            onClick={() => setDeleteMailbox(mailbox)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-subtle px-4 py-10 text-center text-13 text-tertiary">
              Ящиков пока нет. Создайте первый, чтобы начать.
            </div>
          )}
        </div>
      )}

      {activeTab === "aliases" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" prependIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateAliasOpen(true)}>
              Создать алиас
            </Button>
          </div>
          {aliasesLoading ? (
            <Loader className="space-y-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : aliases && aliases.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-subtle">
              <table className="w-full text-13">
                <thead className="bg-layer-1 text-tertiary">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Источник</th>
                    <th className="px-4 py-2 text-left font-medium">Пересылать на</th>
                    <th className="px-4 py-2 text-right font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {aliases.map((alias) => (
                    <tr key={alias.id} className="text-primary">
                      <td className="px-4 py-2">{alias.source}</td>
                      <td className="px-4 py-2 text-secondary">{alias.destination}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Удалить"
                            className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                            onClick={() => setDeleteAliasId(alias.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-subtle px-4 py-10 text-center text-13 text-tertiary">
              Алиасов пока нет.
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Почтовый сервер - God Mode" }];

export default MailPage;
