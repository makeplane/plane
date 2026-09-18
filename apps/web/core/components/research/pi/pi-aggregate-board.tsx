/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TPiAggregate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// hooks
import { useResearch } from "@/hooks/store/use-research";
// services
import { ResearchAccountService } from "@/services/research/account.service";

const accountService = new ResearchAccountService();

type Props = {
  workspaceSlug: string;
};

/** Permission-scoped research overview for a PI, direction owner or mentor. */
export const ResearchPiAggregateBoard = observer(function ResearchPiAggregateBoard({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [aggregate, setAggregate] = useState<TPiAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [orgUnit, setOrgUnit] = useState("");
  const [owner, setOwner] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const canSee = (key: string) => research.canSee(key);

  const load = useCallback(
    async (params: { org_unit?: string; owner?: string; date_from?: string; date_to?: string } = {}) => {
      try {
        setLoading(true);
        setFailed(false);
        setAggregate(await accountService.getPiAggregate(workspaceSlug, params));
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    },
    [workspaceSlug]
  );

  useEffect(() => {
    void load({});
  }, [load]);

  const applyFilters = () =>
    void load({
      org_unit: orgUnit || undefined,
      owner: owner.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (failed || !aggregate) {
    return <p className="p-5 text-12 text-danger-primary">{t("research.pi.error.load")}</p>;
  }

  const source = aggregate.source_workspace.slug;
  const drilldownHref = (path: string, params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return `/${source}/research/${path}${query ? `?${query}` : ""}`;
  };
  const cards = [
    {
      key: "members",
      label: t("research.pi.cards.members"),
      value: aggregate.members?.total ?? 0,
      detail: t("research.pi.cards.members_hint"),
      href: research.canSee("org") ? `/${source}/research/settings/org` : null,
    },
    {
      key: "projects",
      label: t("research.pi.cards.projects"),
      value: aggregate.projects.total,
      detail: Object.entries(aggregate.projects.by_status)
        .map(([status, count]) => `${t(`research.project_status.${status.toLowerCase()}`)} ${count}`)
        .join(" · "),
      href: canSee("projects") ? drilldownHref("projects", aggregate.drilldowns.projects) : null,
    },
    {
      key: "reports",
      label: t("research.pi.cards.reports"),
      value: aggregate.reports.total,
      detail: `${t("research.pi.cards.pending_review")} ${
        aggregate.reports.by_status.SUBMITTED ?? 0
      } · ${t("research.pi.cards.not_submitted", { count: aggregate.reports.not_submitted })} · ${t("research.pi.cards.recent_submissions", { count: aggregate.reports.submitted_last_30_days })}`,
      href: canSee("reports") ? drilldownHref("reports", aggregate.drilldowns.reports) : null,
    },
    {
      key: "stages",
      label: t("research.pi.cards.stages"),
      value: aggregate.stages.total,
      detail: `${t("research.pi.cards.blocked")} ${aggregate.stages.blocked_gates}`,
      href: canSee("reviews") ? `/${source}/research/reviews` : null,
    },
    {
      key: "reviews",
      label: t("research.pi.cards.reviews"),
      value: aggregate.reviews.awaiting_stages,
      detail: `${t("research.pi.cards.open_assignments")} ${aggregate.reviews.open_assignments}`,
      href: canSee("reviews") ? `/${source}/research/reviews` : null,
    },
    {
      key: "approvals",
      label: t("research.pi.cards.approvals"),
      value: aggregate.approvals.pending,
      detail: t("research.pi.cards.pending_only"),
      href: canSee("approvals") ? `/${source}/research/approvals` : null,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-14 font-medium text-primary">{t("research.pi.title")}</h3>
          <p className="mt-0.5 text-12 text-tertiary">
            {t("research.pi.scope_summary", {
              units: aggregate.scope.unit_count,
              workspace: aggregate.source_workspace.name,
            })}
          </p>
        </div>
        <span className="text-11 text-tertiary">
          {t("research.pi.generated_at")} {new Date(aggregate.generated_at).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-md border border-subtle p-3">
        <label className="flex flex-col gap-1 text-11 text-tertiary">
          <span>{t("research.pi.filters.org_unit")}</span>
          <select
            className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
            value={orgUnit}
            onChange={(event) => setOrgUnit(event.target.value)}
          >
            <option value="">{t("research.pi.filters.all_org_units")}</option>
            {aggregate.org_units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-11 text-tertiary">
          <span>{t("research.pi.filters.owner")}</span>
          <Input
            className="!w-48"
            placeholder={t("research.pi.filters.owner_placeholder")}
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-11 text-tertiary">
          <span>{t("research.common.date_from")}</span>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-11 text-tertiary">
          <span>{t("research.common.date_to")}</span>
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <Button variant="secondary" size="sm" onClick={applyFilters}>
          {t("research.common.apply_filters")}
        </Button>
      </div>

      {aggregate.scope.is_empty ? (
        <p className="rounded-md border border-subtle p-4 text-12 text-tertiary">{t("research.pi.empty_scope")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const content = (
              <>
                <span className="text-12 text-tertiary">{card.label}</span>
                <span className="text-20 font-medium text-primary">{card.value}</span>
                <span className="text-11 text-tertiary">{card.detail}</span>
              </>
            );
            return card.href ? (
              <Link
                key={card.key}
                href={card.href}
                className="flex flex-col gap-1 rounded-md border border-subtle p-4 transition-colors hover:bg-surface-2"
              >
                {content}
              </Link>
            ) : (
              <div key={card.key} className="flex flex-col gap-1 rounded-md border border-subtle p-4">
                {content}
              </div>
            );
          })}
        </div>
      )}

      {aggregate.org_units.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="text-12 font-medium text-primary">{t("research.pi.org_units")}</h4>
          <div className="flex flex-wrap gap-2">
            {aggregate.org_units.map((unit) => (
              <span
                key={unit.id}
                className="rounded-full border border-subtle px-2 py-0.5 text-11 text-secondary"
                style={{ marginLeft: `${Math.min(unit.depth, 4) * 8}px` }}
              >
                {unit.name}
              </span>
            ))}
          </div>
        </section>
      )}
      {(aggregate.outcomes?.recent.length ?? 0) > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="text-12 font-medium text-primary">{t("research.pi.recent_outcomes")}</h4>
          <ul className="flex flex-col divide-y divide-subtle rounded-md border border-subtle px-3">
            {aggregate.outcomes?.recent.map((outcome) => (
              <li key={outcome.id} className="flex items-center justify-between gap-3 py-2 text-12">
                <span className="truncate text-secondary">{outcome.title}</span>
                <span className="shrink-0 text-tertiary">{outcome.published_at ?? "-"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
});

export default ResearchPiAggregateBoard;
