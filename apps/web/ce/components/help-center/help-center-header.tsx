/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowLeft, ChevronRight, LifeBuoy } from "lucide-react";
import { Link, useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useWorkspace } from "@/hooks/store/use-workspace";
import ShinhanBankLogo from "@/app/assets/logos/shinhan-bank-logo.svg?url";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";
import { HelpHeaderSearch } from "./help-header-search";
import { HelpCenterUserMenu } from "./help-center-user-menu";

// Top bar for the standalone (workspace-agnostic) /help route. Three zones:
// LEFT brand (Shinhan logo + Help Center label, links to /help) tells users which
// system this help belongs to; CENTER breadcrumb appends the article title on an
// article page; RIGHT carries the "back to app" link + the signed-in user's account
// menu. /help has no workspace context, so the back link resolves to the user's
// last/fallback workspace. observer() keeps it reactive to the fetch + locale switch.
export const HelpCenterHeader = observer(function HelpCenterHeader() {
  const { articleSlug } = useParams();
  const { t } = useTranslation();
  const { article } = useHelpCenter();
  const { getWorkspaceRedirectionUrl } = useWorkspace();

  const backUrl = getWorkspaceRedirectionUrl();
  const slug = articleSlug?.toString();
  const detail = slug ? article.getArticleDetailBySlug(slug) : null;

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-subtle px-4">
      {/* Brand + breadcrumb — brand identifies the system and links back to /help */}
      <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-3 text-13">
        <Link to="/help" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80">
          <img src={ShinhanBankLogo} alt="Shinhan Bank" className="h-6 w-auto" />
          <span className="h-5 border-l border-subtle" aria-hidden />
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <LifeBuoy className="size-4 shrink-0 text-icon-primary" />
            {/* Logo alone represents home on small screens so the article title gets the space */}
            <span className="hidden sm:inline">{t("help_center.breadcrumb_home")}</span>
          </span>
        </Link>
        {slug && (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-tertiary" aria-hidden />
            <span className="truncate text-secondary">{detail?.title ?? slug}</span>
          </>
        )}
      </nav>

      {/* Right zone: in-article search + back-to-app + signed-in user (who am I + sign out) */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {slug && <HelpHeaderSearch />}
        <Link
          to={backUrl}
          aria-label={t("help_center.back_to_app")}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-13 text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:block">{t("help_center.back_to_app")}</span>
        </Link>
        <HelpCenterUserMenu />
      </div>
    </header>
  );
});
