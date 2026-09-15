/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";

const SECTION_CARDS = [
  { key: "reports", path: "reports", titleKey: "research.nav.reports", section: "reports" },
  { key: "summary", path: "reports/summary", titleKey: "research.nav.summary", section: "reports" },
  { key: "projects", path: "projects", titleKey: "research.nav.projects", section: "reports" },
  { key: "approvals", path: "approvals", titleKey: "research.nav.approvals", section: "approvals" },
] as const;

const SETTINGS_CARDS = [
  { key: "org", path: "settings/org", titleKey: "research.nav.org_settings" },
  { key: "templates", path: "settings/templates", titleKey: "research.nav.templates" },
  { key: "identity", path: "settings/identity", titleKey: "research.nav.identity" },
  { key: "platform", path: "settings/platform", titleKey: "research.nav.platform" },
  { key: "audit", path: "audit", titleKey: "research.nav.audit" },
] as const;

function WorkspaceResearchOverviewPage() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();

  return (
    <ResearchPageShell titleKey="research.nav.overview" descriptionKey="research.overview.description">
      <div className="h-full overflow-y-auto p-5">
        <h3 className="text-13 font-medium text-primary">{t("research.overview.business_sections")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SECTION_CARDS.map((card) => (
            <Link
              key={card.key}
              href={`/${workspaceSlug}/research/${card.path}`}
              className="rounded-lg border border-subtle bg-surface-1 p-4 transition-colors hover:bg-surface-2"
            >
              <p className="text-13 font-medium text-primary">{t(card.titleKey)}</p>
              <p className="mt-1 text-11 text-tertiary">{t(`research.overview.${card.key}_hint`)}</p>
            </Link>
          ))}
        </div>

        <h3 className="mt-8 text-13 font-medium text-primary">{t("research.overview.settings_sections")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SETTINGS_CARDS.map((card) => (
            <Link
              key={card.key}
              href={`/${workspaceSlug}/research/${card.path}`}
              className="rounded-lg border border-subtle bg-surface-1 p-4 transition-colors hover:bg-surface-2"
            >
              <p className="text-13 font-medium text-primary">{t(card.titleKey)}</p>
              <p className="mt-1 text-11 text-tertiary">{t(`research.overview.${card.key}_hint`)}</p>
            </Link>
          ))}
        </div>
      </div>
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchOverviewPage);
