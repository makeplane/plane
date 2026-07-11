/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NavLink, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { Archive, FileText, Inbox, PenLine, Plus, Send, Settings, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useMail } from "@/hooks/store/use-mail";

const FALLBACK_FOLDER_KEYS = ["inbox", "starred", "sent", "drafts", "archive", "spam", "trash"] as const;

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
  const navigate = useNavigate();
  const fallbackFolders = FALLBACK_FOLDER_KEYS.map((key) => ({ key, label: t(`mail.folders.${key}`), unread: 0 }));
  const folders = mail.folders.length ? mail.folders : fallbackFolders;

  const initials = (mail.mailboxEmail.split("@")[0]?.slice(0, 2) || "@@").toUpperCase();

  return (
    <aside className="mail-sidebar flex h-full w-[280px] flex-shrink-0 flex-col border-r border-[var(--mail-border)] bg-[var(--mail-sidebar)] px-4 py-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="mail-sidebar-meta">
          <div className="text-lg font-semibold text-[var(--mail-ink)]">Gizmo Mail</div>
          <div className="text-xs max-w-[190px] truncate text-[var(--mail-muted)]">{mail.mailboxEmail}</div>
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
        className="text-sm mb-5 flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--mail-accent)] px-3 font-medium text-white hover:bg-[var(--mail-accent-strong)]"
        onClick={() => mail.openCompose()}
      >
        <PenLine className="size-4" />
        <span className="mail-sidebar-label">{t("mail.compose.new")}</span>
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
                  "text-sm flex h-9 items-center justify-between rounded-md px-2.5 text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]",
                  isActive && "shadow-sm bg-[var(--mail-panel)] text-[var(--mail-ink)]"
                )
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 flex-shrink-0" />
                <span className="mail-sidebar-label truncate">{folder.label}</span>
              </span>
              {!!folder.unread && (
                <span className="mail-sidebar-label text-xs rounded-full bg-[var(--mail-accent-soft)] px-2 py-0.5 text-[var(--mail-accent)]">
                  {folder.unread}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mail-sidebar-section mt-4 border-t border-[var(--mail-border)] pt-4">
        <div className="mb-1 flex items-center justify-between px-2.5">
          <span className="text-xs font-semibold tracking-wide text-[var(--mail-muted)] uppercase">
            {t("mail.sidebar.labels")}
          </span>
          <button
            type="button"
            className="grid size-6 place-items-center rounded text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
            title={t("mail.sidebar.new_label")}
            onClick={() => navigate("/mail/settings?tab=folders")}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {mail.labels.length ? (
            mail.labels.map((label) => (
              <button
                key={label.id}
                type="button"
                className="text-sm flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
                onClick={() => navigate(`/mail/search?label=${encodeURIComponent(label.id)}`)}
              >
                <span className="size-2.5 flex-shrink-0 rounded" style={{ backgroundColor: label.color }} />
                <span className="truncate">{label.name}</span>
              </button>
            ))
          ) : (
            <div className="text-xs px-2.5 py-1 text-[var(--mail-muted)]">{t("mail.sidebar.no_labels")}</div>
          )}
        </div>
      </div>

      <NavLink
        to="/mail/settings?tab=account"
        className="mt-4 flex items-center gap-3 rounded-lg border-t border-[var(--mail-border)] px-2 pt-4 hover:opacity-80"
      >
        <span className="text-xs grid size-8 flex-shrink-0 place-items-center rounded-full bg-[var(--mail-ink)] font-semibold text-white">
          {initials}
        </span>
        <span className="mail-sidebar-label text-xs min-w-0 flex-1 truncate text-[var(--mail-muted)]">
          {mail.mailboxEmail}
        </span>
      </NavLink>
    </aside>
  );
});
