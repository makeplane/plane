/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { useMail } from "@/hooks/store/use-mail";

export const MailWebmailView = observer(function MailWebmailView() {
  const { t } = useTranslation();
  const mail = useMail();
  const [frameKey, setFrameKey] = useState(0);

  if (!mail.webmailUrl) {
    return (
      <div className="flex size-full items-center justify-center bg-[var(--mail-bg)] px-8 text-center">
        <div className="max-w-md">
          <h1 className="text-lg font-semibold text-[var(--mail-ink)]">{t("mail.webmail.unavailable_title")}</h1>
          <p className="text-sm mt-2 leading-6 text-[var(--mail-muted)]">{t("mail.webmail.unavailable_description")}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex size-full flex-col bg-[var(--mail-bg)]">
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[var(--mail-border)] bg-[var(--mail-panel)] px-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--mail-ink)]">{t("mail.webmail.title")}</div>
          <div className="text-xs truncate text-[var(--mail-muted)]">{mail.webmailUrl}</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button type="button" className="mail-secondary-button" onClick={() => setFrameKey((key) => key + 1)}>
            <RefreshCw className="size-4" />
            {t("mail.webmail.reload")}
          </button>
          <a className="mail-secondary-button" href={mail.webmailUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            {t("mail.webmail.open_external")}
          </a>
        </div>
      </header>
      <iframe
        key={frameKey}
        title={t("mail.webmail.title")}
        src={mail.webmailUrl}
        sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"
        className="min-h-0 flex-1 border-0 bg-white"
      />
    </section>
  );
});
