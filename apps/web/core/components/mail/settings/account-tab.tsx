/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { observer } from "mobx-react";
import { ExternalLink, Globe2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { useMail } from "@/hooks/store/use-mail";
import { Card, CardRow, MailToggle, SectionTitle, SelectField, SettingsHeader } from "./primitives";

const initialsOf = (email: string) => {
  const local = email.split("@")[0] ?? "";
  return (local.slice(0, 2) || "@@").toUpperCase();
};

export const MailAccountSettings = observer(function MailAccountSettings() {
  const { t } = useTranslation();
  const mail = useMail();
  const prefs = mail.preferences;

  const patch = async (data: Record<string, unknown>) => {
    try {
      await mail.patchPreferences(data);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.settings.toasts.error") });
    }
  };

  return (
    <div className="max-w-2xl">
      <SettingsHeader title={t("mail.settings.tabs.account")} description={t("mail.settings.account.subtitle")} />
      <Card>
        <div className="flex items-center gap-4 p-5">
          <div className="text-lg grid size-14 flex-shrink-0 place-items-center rounded-full bg-[var(--mail-ink)] font-semibold text-white">
            {initialsOf(mail.mailboxEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base truncate font-semibold text-[var(--mail-ink)]">{mail.mailboxEmail}</div>
            <div className="text-sm mt-0.5 text-[var(--mail-muted)]">
              {t("mail.settings.account.domain")}: {mail.mailDomain}
            </div>
          </div>
        </div>
      </Card>

      {mail.webmailUrl && (
        <>
          <SectionTitle>{t("mail.settings.account.integrations")}</SectionTitle>
          <Card>
            <CardRow last>
              <span className="text-[var(--mail-muted)]">
                <Globe2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--mail-ink)]">
                  {t("mail.settings.account.webmail_title")}
                </div>
                <div className="text-sm mt-0.5 truncate text-[var(--mail-muted)]">{mail.webmailUrl}</div>
              </div>
              <Link to="/mail/webmail" className="mail-secondary-button">
                <ExternalLink className="size-4" />
                {t("mail.settings.account.open_webmail")}
              </Link>
            </CardRow>
          </Card>
        </>
      )}

      <SectionTitle>{t("mail.settings.account.general")}</SectionTitle>
      <Card>
        <CardRow>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--mail-ink)]">
              {t("mail.settings.account.conversation_view")}
            </div>
            <div className="text-sm mt-0.5 text-[var(--mail-muted)]">
              {t("mail.settings.account.conversation_view_desc")}
            </div>
          </div>
          <MailToggle value={!!prefs?.conversation_view} onChange={(value) => patch({ conversation_view: value })} />
        </CardRow>
        <CardRow>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--mail-ink)]">
              {t("mail.settings.account.show_snippets")}
            </div>
            <div className="text-sm mt-0.5 text-[var(--mail-muted)]">
              {t("mail.settings.account.show_snippets_desc")}
            </div>
          </div>
          <MailToggle value={!!prefs?.show_snippets} onChange={(value) => patch({ show_snippets: value })} />
        </CardRow>
        <CardRow last>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--mail-ink)]">{t("mail.settings.account.language")}</div>
            <div className="text-sm mt-0.5 text-[var(--mail-muted)]">{t("mail.settings.account.language_desc")}</div>
          </div>
          <SelectField value={prefs?.language ?? "ru"} onChange={(event) => patch({ language: event.target.value })}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </SelectField>
        </CardRow>
      </Card>
    </div>
  );
});
