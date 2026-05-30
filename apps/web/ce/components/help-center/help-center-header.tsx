/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowLeft, LifeBuoy } from "lucide-react";
import { Link, useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";

// Top bar for the standalone (workspace-agnostic) /help route. `/help` has no
// workspace context, so the back link resolves to the user's last/fallback
// workspace (or create-workspace). On an article page it appends the title to
// the breadcrumb; observer() keeps it reactive to the fetch + locale switch.
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
      <Link
        to={backUrl}
        className="flex shrink-0 items-center gap-1.5 text-13 text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        <span>{t("help_center.back_to_app")}</span>
      </Link>
      <span className="text-tertiary">/</span>
      <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1.5 text-13">
        <Link
          to="/help"
          className="flex shrink-0 items-center gap-1.5 font-medium text-primary transition-colors hover:text-accent-primary"
        >
          <LifeBuoy className="size-4 text-icon-primary" />
          <span>{t("help_center.breadcrumb_home")}</span>
        </Link>
        {slug && (
          <>
            <span className="text-tertiary">›</span>
            <span className="truncate text-secondary">{detail?.title ?? slug}</span>
          </>
        )}
      </nav>
    </header>
  );
});
