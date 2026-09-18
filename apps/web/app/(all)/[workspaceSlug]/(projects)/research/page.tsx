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
import { ResearchPiAggregateBoard } from "@/components/research/pi/pi-aggregate-board";
// hooks
import { useResearch } from "@/hooks/store/use-research";

/**
 * Overview cards mirror the sidebar: the same workspace sub switch and the same
 * capability key decide whether a card renders (v2.5.0). Keys match the
 * backend navigation keys so one rule drives both surfaces.
 */
const BUSINESS_CARDS = [
  { key: "reports", path: "reports", titleKey: "research.nav.reports", section: "reports" },
  { key: "summary", path: "reports/summary", titleKey: "research.nav.summary", section: "reports" },
  { key: "projects", path: "projects", titleKey: "research.nav.projects", section: "reports" },
  { key: "approvals", path: "approvals", titleKey: "research.nav.approvals", section: "approvals" },
] as const;

const SETTINGS_CARDS = [
  { key: "org", path: "settings/org", titleKey: "research.nav.org_settings", section: "org" },
  { key: "system", path: "settings/system", titleKey: "research.nav.system", section: "org" },
  { key: "templates", path: "settings/templates", titleKey: "research.nav.templates", section: "reports" },
  { key: "identity", path: "settings/identity", titleKey: "research.nav.identity", section: "org" },
  { key: "platform", path: "settings/platform", titleKey: "research.nav.platform", section: "org" },
  { key: "audit", path: "audit", titleKey: "research.nav.audit", section: "org" },
] as const;

function WorkspaceResearchOverviewPage() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const research = useResearch();
  const sections = research.identity?.sections;

  const isCardVisible = (card: { key: string; section: string }) =>
    Boolean(sections?.[card.section as keyof typeof sections]) && research.canSee(card.key);

  const businessCards = BUSINESS_CARDS.filter(isCardVisible);
  const settingsCards = SETTINGS_CARDS.filter(isCardVisible);

  return (
    <ResearchPageShell
      titleKey="research.nav.overview"
      descriptionKey="research.overview.description"
      navKey="overview"
    >
      <div className="h-full overflow-y-auto p-5">
        {workspaceSlug && research.canSee("dashboard") && (
          <div className="mb-6 overflow-hidden rounded-lg border border-subtle bg-surface-1">
            <ResearchPiAggregateBoard workspaceSlug={workspaceSlug} />
          </div>
        )}
        <section className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-subtle bg-surface-1 p-4">
            <h3 className="text-13 font-medium text-primary">{t("research.overview.pending_title")}</h3>
            <p className="mt-1 text-11 text-tertiary">{t("research.overview.pending_description")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {research.canSee("reviews") && (
                <Link
                  href={`/${workspaceSlug}/research/reviews`}
                  className="rounded-md border border-subtle px-3 py-1.5 text-12 text-secondary hover:bg-surface-2"
                >
                  {t("research.overview.open_reviews")}
                </Link>
              )}
              {research.canSee("approvals") && (
                <Link
                  href={`/${workspaceSlug}/research/approvals`}
                  className="rounded-md border border-subtle px-3 py-1.5 text-12 text-secondary hover:bg-surface-2"
                >
                  {t("research.overview.open_approvals")}
                </Link>
              )}
              {research.canSee("reports") && (
                <Link
                  href={`/${workspaceSlug}/research/reports?status=NEEDS_REVISION&mine=true`}
                  className="rounded-md border border-subtle px-3 py-1.5 text-12 text-secondary hover:bg-surface-2"
                >
                  {t("research.overview.open_revisions")}
                </Link>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-1 p-4">
            <h3 className="text-13 font-medium text-primary">{t("research.overview.next_title")}</h3>
            <p className="mt-1 text-11 text-tertiary">{t("research.overview.next_description")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {research.canSee("projects") && (
                <Link
                  href={`/${workspaceSlug}/research/projects`}
                  className="rounded-md bg-accent-primary px-3 py-1.5 text-12 text-on-color"
                >
                  {t("research.overview.open_projects")}
                </Link>
              )}
              {research.canSee("reports") && (
                <Link
                  href={`/${workspaceSlug}/research/reports`}
                  className="rounded-md border border-subtle px-3 py-1.5 text-12 text-secondary hover:bg-surface-2"
                >
                  {t("research.overview.open_reports")}
                </Link>
              )}
            </div>
          </div>
        </section>
        <h3 className="text-13 font-medium text-primary">{t("research.overview.business_sections")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {businessCards.map((card) => (
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

        {settingsCards.length > 0 && (
          <>
            <h3 className="mt-8 text-13 font-medium text-primary">{t("research.overview.settings_sections")}</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {settingsCards.map((card) => (
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
          </>
        )}
      </div>
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchOverviewPage);
