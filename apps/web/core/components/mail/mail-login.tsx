/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { Mail, ShieldCheck } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useMail } from "@/hooks/store/use-mail";

export const MailLogin = observer(function MailLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mail = useMail();
  const [mode, setMode] = useState<"create" | "login">("create");
  const [localPart, setLocalPart] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const openInbox = async () => {
    await mail.fetchFolders().catch(() => undefined);
    navigate("/mail/inbox", { replace: true });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await mail
      .createAccount({
        local_part: localPart,
        domain: mail.mailDomain,
        password: createPassword,
      })
      .catch(() => null);
    if (response?.has_mailbox) await openInbox();
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await mail.loginAccount({ email, password: loginPassword }).catch(() => null);
    if (response?.has_mailbox) await openInbox();
  };

  return (
    <div className="grid size-full bg-[var(--mail-bg)] lg:grid-cols-[1fr_520px]">
      <section className="flex min-h-0 flex-col justify-center px-8 py-10 lg:px-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex size-12 items-center justify-center rounded-lg bg-[var(--mail-accent)] text-white">
            <Mail className="size-6" />
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-[var(--mail-ink)]">{t("mail.login.title")}</h1>
          <p className="mt-4 text-base leading-7 text-[var(--mail-muted)]">{t("mail.login.description")}</p>

          <div className="mt-8 inline-flex rounded-md border border-[var(--mail-border)] bg-white p-1">
            {(["create", "login"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={cn(
                  "h-9 rounded px-3 text-sm font-medium text-[var(--mail-muted)]",
                  mode === key && "bg-[var(--mail-hover)] text-[var(--mail-ink)]"
                )}
                onClick={() => setMode(key)}
              >
                {t(`mail.login.tabs.${key}`)}
              </button>
            ))}
          </div>

          {mode === "create" ? (
            <form className="mt-6 max-w-md space-y-4" onSubmit={handleCreate}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[var(--mail-ink)]">{t("mail.login.create.address")}</span>
                <div className="flex h-11 overflow-hidden rounded-md border border-[var(--mail-border)] bg-white focus-within:border-[var(--mail-accent)]">
                  <input
                    className="min-w-0 flex-1 px-3 text-sm outline-none"
                    value={localPart}
                    onChange={(event) => setLocalPart(event.target.value)}
                    placeholder={t("mail.login.create.address_placeholder")}
                    required
                  />
                  <div className="flex items-center border-l border-[var(--mail-border)] px-3 text-sm text-[var(--mail-muted)]">
                    @{mail.mailDomain}
                  </div>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[var(--mail-ink)]">{t("mail.login.password")}</span>
                <input
                  className="h-11 w-full rounded-md border border-[var(--mail-border)] bg-white px-3 text-sm outline-none focus:border-[var(--mail-accent)]"
                  type="password"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              {mail.accountError && (
                <div className="rounded-md bg-[var(--mail-accent-soft)] px-3 py-2 text-sm text-[var(--mail-accent)]">
                  {mail.accountError}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button className="mail-primary-button h-10 px-4" type="submit" disabled={mail.actionLoader}>
                  {t("mail.login.create.submit")}
                </button>
                <Link to="/" className="mail-secondary-button h-10 px-4">
                  {t("mail.login.back")}
                </Link>
              </div>
            </form>
          ) : (
            <form className="mt-6 max-w-md space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[var(--mail-ink)]">{t("mail.login.email")}</span>
                <input
                  className="h-11 w-full rounded-md border border-[var(--mail-border)] bg-white px-3 text-sm outline-none focus:border-[var(--mail-accent)]"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={`name@${mail.mailDomain}`}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[var(--mail-ink)]">{t("mail.login.password")}</span>
                <input
                  className="h-11 w-full rounded-md border border-[var(--mail-border)] bg-white px-3 text-sm outline-none focus:border-[var(--mail-accent)]"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </label>
              {mail.accountError && (
                <div className="rounded-md bg-[var(--mail-accent-soft)] px-3 py-2 text-sm text-[var(--mail-accent)]">
                  {mail.accountError}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button className="mail-primary-button h-10 px-4" type="submit" disabled={mail.actionLoader}>
                  {t("mail.login.login_submit")}
                </button>
                <Link to="/" className="mail-secondary-button h-10 px-4">
                  {t("mail.login.back")}
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6">
            <Link to="/mail/inbox" className="text-sm font-medium text-[var(--mail-accent)] hover:underline">
              {t("mail.login.retry")}
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
});
