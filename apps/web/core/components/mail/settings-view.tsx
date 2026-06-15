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
import { MailAccountSettings } from "./settings/account-tab";
import { MailAppearanceSettings } from "./settings/appearance-tab";
import { MailFiltersSettings } from "./settings/filters-tab";
import { MailFoldersSettings } from "./settings/folders-tab";
import { MailForwardingSettings } from "./settings/forwarding-tab";
import { MailSecuritySettings } from "./settings/security-tab";
import { MailSignatureSettings } from "./settings/signature-tab";
import { MailTemplatesSettings } from "./settings/templates-tab";

const TABS = ["account", "signature", "folders", "filters", "templates", "forwarding", "security", "appearance"];

export const MailSettingsView = observer(function MailSettingsView() {
  const { t } = useTranslation();
  const mail = useMail();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "account";

  useEffect(() => {
    mail.fetchSettings().catch(() => undefined);
    if (!mail.folders.length) mail.fetchFolders().catch(() => undefined);
  }, [mail]);

  return (
    <div className="flex size-full overflow-hidden bg-[var(--mail-bg)]">
      <aside className="flex w-[240px] flex-shrink-0 flex-col border-r border-[var(--mail-border)] bg-[var(--mail-panel)] p-4">
        <div className="px-2 pb-3">
          <div className="text-lg font-semibold text-[var(--mail-ink)]">{t("mail.settings.title")}</div>
          <div className="mt-0.5 text-xs text-[var(--mail-muted)]">{t("mail.settings.subtitle")}</div>
        </div>
        <nav className="space-y-0.5">
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
      <section className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
        {activeTab === "account" && <MailAccountSettings />}
        {activeTab === "signature" && <MailSignatureSettings />}
        {activeTab === "folders" && <MailFoldersSettings />}
        {activeTab === "filters" && <MailFiltersSettings />}
        {activeTab === "templates" && <MailTemplatesSettings />}
        {activeTab === "forwarding" && <MailForwardingSettings />}
        {activeTab === "security" && <MailSecuritySettings />}
        {activeTab === "appearance" && <MailAppearanceSettings />}
      </section>
    </div>
  );
});
