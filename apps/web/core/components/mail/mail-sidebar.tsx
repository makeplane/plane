/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NavLink } from "react-router";
import { observer } from "mobx-react";
import { Archive, FileText, Inbox, PenLine, Plus, Send, Settings, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useMail } from "@/hooks/store/use-mail";

const FALLBACK_FOLDERS = [
  { key: "inbox", label: "Входящие", unread: 0 },
  { key: "starred", label: "Помеченные", unread: 0 },
  { key: "sent", label: "Отправленные", unread: 0 },
  { key: "drafts", label: "Черновики", unread: 0 },
  { key: "archive", label: "Архив", unread: 0 },
  { key: "spam", label: "Спам", unread: 0 },
  { key: "trash", label: "Корзина", unread: 0 },
];

const ICONS = {
  inbox: Inbox,
  starred: Star,
  sent: Send,
  drafts: FileText,
  archive: Archive,
  spam: ShieldAlert,
  trash: Trash2,
};

export const MailSidebar = observer(function MailSidebar() {
  const { t } = useTranslation();
  const mail = useMail();
  const folders = mail.folders.length ? mail.folders : FALLBACK_FOLDERS;

  return (
    <aside className="mail-sidebar flex h-full w-[280px] flex-shrink-0 flex-col border-r border-[var(--mail-border)] bg-[var(--mail-sidebar)] px-4 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-[var(--mail-ink)]">Gizmo Mail</div>
          <div className="max-w-[190px] truncate text-xs text-[var(--mail-muted)]">{mail.mailboxEmail}</div>
        </div>
        <NavLink
          to="/mail/settings"
          className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
          title={t("mail.settings.title")}
        >
          <Settings className="size-4" />
        </NavLink>
      </div>

      <button
        type="button"
        className="mb-5 flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--mail-accent)] px-3 text-sm font-medium text-white hover:bg-[var(--mail-accent-strong)]"
        onClick={() => mail.openCompose()}
      >
        <PenLine className="size-4" />
        {t("mail.compose.new")}
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {folders.map((folder) => {
          const Icon = ICONS[folder.key as keyof typeof ICONS] ?? Inbox;
          return (
            <NavLink
              key={folder.key}
              to={`/mail/${folder.key}`}
              className={({ isActive }) =>
                cn(
                  "flex h-9 items-center justify-between rounded-md px-2.5 text-sm text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]",
                  isActive && "bg-white text-[var(--mail-ink)] shadow-sm"
                )
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 flex-shrink-0" />
                <span className="truncate">{folder.label}</span>
              </span>
              {!!folder.unread && (
                <span className="rounded-full bg-[var(--mail-accent-soft)] px-2 py-0.5 text-xs text-[var(--mail-accent)]">
                  {folder.unread}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-5 border-t border-[var(--mail-border)] pt-4">
        <button
          type="button"
          className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
        >
          <Plus className="size-4" />
          {t("mail.sidebar.new_label")}
        </button>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--mail-muted)]">
            <span>{t("mail.sidebar.storage")}</span>
            <span>0%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--mail-border)]">
            <div className="h-1.5 w-[8%] rounded-full bg-[var(--mail-accent)]" />
          </div>
        </div>
      </div>
    </aside>
  );
});
