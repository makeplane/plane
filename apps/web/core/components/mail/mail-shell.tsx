/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { useMail } from "@/hooks/store/use-mail";
import { useUserProfile } from "@/hooks/store/user";
import { ComposeModal } from "./compose-modal";
import { MailSidebar } from "./mail-sidebar";

const resolveGizmoThemeForMail = (theme: string | undefined, customThemeUsesDarkPalette?: boolean) => {
  if (theme === "dark" || theme === "dark-contrast") return "dark";
  if (theme === "custom" && customThemeUsesDarkPalette) return "dark";
  return "light";
};

export const MailShell = observer(function MailShell() {
  const { t } = useTranslation();
  const mail = useMail();
  const { data: userProfile } = useUserProfile();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/mail/login";
  const mailTheme = useMemo(() => {
    if (mail.preferences.theme === "light" || mail.preferences.theme === "dark") return mail.preferences.theme;
    return resolveGizmoThemeForMail(resolvedTheme, userProfile?.theme?.darkPalette);
  }, [mail.preferences.theme, resolvedTheme, userProfile?.theme?.darkPalette]);
  const mailDensity = mail.preferences.density === "compact" ? "compact" : "comfortable";

  useEffect(() => {
    void (async () => {
      const response = await mail.fetchMe().catch(() => null);
      if (response?.has_mailbox) {
        mail.fetchFolders().catch(() => undefined);
        mail.fetchSettings().catch(() => undefined);
      }
    })();
  }, [mail]);

  if (mail.me && !mail.hasMailbox && !isLogin) return <Navigate to="/mail/login" replace />;

  return (
    <AuthenticationWrapper>
      <div
        data-mail
        data-mail-theme={mailTheme}
        data-mail-density={mailDensity}
        className="mail-root flex size-full overflow-hidden bg-[var(--mail-bg)] text-[var(--mail-ink)]"
      >
        {isLogin ? (
          <Outlet />
        ) : (
          <>
            <MailSidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--mail-border)] bg-[var(--mail-panel)] px-5">
                <div className="flex items-center gap-3">
                  <Link
                    to="/"
                    className="grid size-8 place-items-center rounded-md text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
                    title={t("mail.topbar.back")}
                  >
                    <ArrowLeft className="size-4" />
                  </Link>
                  <div className="text-sm font-medium text-[var(--mail-ink)]">{t("mail.topbar.title")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="mail-secondary-button"
                    onClick={() => {
                      mail.fetchFolders().catch(() => undefined);
                      const folderKey = location.pathname.split("/")[2] || "inbox";
                      if (folderKey && !["settings", "search"].includes(folderKey))
                        mail.fetchMessages(folderKey).catch(() => undefined);
                    }}
                  >
                    <RefreshCw className="size-4" />
                    {t("mail.topbar.refresh")}
                  </button>
                  <button className="mail-secondary-button" type="button" onClick={() => navigate("/mail/search")}>
                    <Search className="size-4" />
                    {t("mail.search.title")}
                  </button>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-hidden">
                <Outlet />
              </div>
            </main>
          </>
        )}
        <ComposeModal />
      </div>
    </AuthenticationWrapper>
  );
});
