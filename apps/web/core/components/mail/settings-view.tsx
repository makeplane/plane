/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useMail } from "@/hooks/store/use-mail";

const TABS = ["account", "signature", "folders", "filters", "templates", "forwarding", "security", "appearance"];

export const MailSettingsView = observer(function MailSettingsView() {
  const { t } = useTranslation();
  const mail = useMail();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "account";

  useEffect(() => {
    mail.fetchSettings().catch(() => undefined);
  }, [mail]);

  return (
    <div className="flex size-full overflow-hidden bg-[var(--mail-bg)]">
      <aside className="w-[260px] flex-shrink-0 border-r border-[var(--mail-border)] bg-[var(--mail-panel)] p-5">
        <div className="mb-4 text-lg font-semibold">{t("mail.settings.title")}</div>
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "mail-settings-tab mail-settings-tab-active" : "mail-settings-tab"}
              onClick={() => setSearchParams({ tab })}
            >
              {t(`mail.settings.tabs.${tab}`)}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          <h1 className="text-xl font-semibold text-[var(--mail-ink)]">{t(`mail.settings.tabs.${activeTab}`)}</h1>
          <div className="mt-5 rounded-md border border-[var(--mail-border)] bg-white p-5">
            {activeTab === "account" && (
              <div className="space-y-3 text-sm">
                <div className="text-[var(--mail-muted)]">{t("mail.settings.account.email")}</div>
                <div className="font-medium text-[var(--mail-ink)]">{mail.mailboxEmail}</div>
              </div>
            )}
            {activeTab === "signature" && (
              <div className="space-y-3">
                {mail.signatures.length ? (
                  mail.signatures.map((signature) => (
                    <div key={signature.id} className="rounded-md border border-[var(--mail-border)] p-3">
                      <div className="font-medium">{signature.name}</div>
                      <div className="mt-2 text-sm text-[var(--mail-muted)]">{signature.content_text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[var(--mail-muted)]">{t("mail.settings.signature.empty")}</div>
                )}
              </div>
            )}
            {activeTab === "folders" && (
              <div className="space-y-2">
                {mail.folders.map((folder) => (
                  <div key={folder.key} className="flex items-center justify-between rounded-md border border-[var(--mail-border)] px-3 py-2 text-sm">
                    <span>{folder.label}</span>
                    <span className="text-[var(--mail-muted)]">{folder.total}</span>
                  </div>
                ))}
                {mail.labels.map((label) => (
                  <div key={label.id} className="flex items-center gap-2 rounded-md border border-[var(--mail-border)] px-3 py-2 text-sm">
                    <span className="size-2 rounded-full" style={{ backgroundColor: label.color }} />
                    <span>{label.name}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "filters" && (
              <div className="space-y-2">
                {mail.filters.length ? (
                  mail.filters.map((filter) => (
                    <div key={filter.id} className="rounded-md border border-[var(--mail-border)] px-3 py-2 text-sm">
                      {filter.name}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[var(--mail-muted)]">{t("mail.settings.filters.empty")}</div>
                )}
              </div>
            )}
            {activeTab === "templates" && (
              <div className="space-y-2">
                {mail.templates.length ? (
                  mail.templates.map((template) => (
                    <div key={template.id} className="rounded-md border border-[var(--mail-border)] px-3 py-2 text-sm">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-[var(--mail-muted)]">{template.subject}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[var(--mail-muted)]">{t("mail.settings.templates.empty")}</div>
                )}
              </div>
            )}
            {activeTab === "forwarding" && (
              <label className="flex items-center justify-between text-sm">
                <span>{t("mail.settings.forwarding.enabled")}</span>
                <input checked={!!mail.forwarding?.forward_enabled} readOnly type="checkbox" />
              </label>
            )}
            {activeTab === "security" && (
              <div className="text-sm text-[var(--mail-muted)]">{t("mail.settings.security.description")}</div>
            )}
            {activeTab === "appearance" && (
              <div className="grid gap-4 text-sm">
                <label>
                  <span className="mb-1 block text-[var(--mail-muted)]">{t("mail.settings.appearance.density")}</span>
                  <select
                    className="h-10 rounded-md border border-[var(--mail-border)] px-3"
                    value={mail.preferences?.density ?? "comfortable"}
                    onChange={(event) => mail.patchPreferences({ density: event.target.value })}
                  >
                    <option value="comfortable">{t("mail.settings.appearance.comfortable")}</option>
                    <option value="compact">{t("mail.settings.appearance.compact")}</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
});
