/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { Mail, ShieldCheck } from "lucide-react";
import { useTranslation } from "@plane/i18n";

export function MailLogin() {
  const { t } = useTranslation();

  return (
    <div className="grid size-full bg-[var(--mail-bg)] lg:grid-cols-[1fr_520px]">
      <section className="flex min-h-0 flex-col justify-center px-8 py-10 lg:px-16">
        <div className="max-w-xl">
          <div className="mb-8 flex size-12 items-center justify-center rounded-lg bg-[var(--mail-accent)] text-white">
            <Mail className="size-6" />
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-[var(--mail-ink)]">{t("mail.login.title")}</h1>
          <p className="mt-4 text-base leading-7 text-[var(--mail-muted)]">{t("mail.login.description")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/mail/inbox" className="mail-primary-button h-10 px-4">
              {t("mail.login.retry")}
            </Link>
            <Link to="/" className="mail-secondary-button h-10 px-4">
              {t("mail.login.back")}
            </Link>
          </div>
        </div>
      </section>
      <aside className="hidden border-l border-[var(--mail-border)] bg-[var(--mail-panel)] p-10 lg:flex lg:flex-col lg:justify-center">
        <div className="space-y-5">
          {["imap", "smtp", "settings"].map((key) => (
            <div key={key} className="flex gap-3">
              <div className="mt-0.5 grid size-8 flex-shrink-0 place-items-center rounded-md bg-[var(--mail-accent-soft)] text-[var(--mail-accent)]">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="font-medium text-[var(--mail-ink)]">{t(`mail.login.features.${key}.title`)}</div>
                <div className="mt-1 text-sm leading-6 text-[var(--mail-muted)]">{t(`mail.login.features.${key}.description`)}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
