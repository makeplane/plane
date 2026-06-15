/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Lock, ShieldCheck } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { useMail } from "@/hooks/store/use-mail";
import { Card, CardRow, SettingsHeader } from "./primitives";

export const MailSecuritySettings = observer(function MailSecuritySettings() {
  const { t } = useTranslation();
  const mail = useMail();

  return (
    <div className="max-w-2xl">
      <SettingsHeader title={t("mail.settings.tabs.security")} description={t("mail.settings.security.subtitle")} />
      <Card>
        <CardRow>
          <span className="text-[var(--mail-muted)]">
            <Lock className="size-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--mail-ink)]">{t("mail.settings.security.mailbox")}</div>
            <div className="mt-0.5 text-sm text-[var(--mail-muted)]">{mail.mailboxEmail}</div>
          </div>
        </CardRow>
        <CardRow last>
          <span className="text-[#3C9568]">
            <ShieldCheck className="size-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[var(--mail-ink)]">{t("mail.settings.security.access")}</div>
            <div className="mt-0.5 text-sm text-[var(--mail-muted)]">{t("mail.settings.security.description")}</div>
          </div>
        </CardRow>
      </Card>
    </div>
  );
});
