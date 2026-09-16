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
import { Spinner } from "@plane/ui";
// services
import { ResearchAccountService } from "@/services/research/account.service";

const accountService = new ResearchAccountService();

type Props = {
  workspaceSlug: string;
};

/**
 * Main PI workspace board.
 *
 * The public workspace owns the data; this board only aggregates it for the
 * caller's subtree and links back, so nothing is duplicated
 * (SYS-PI-01 ~ SYS-PI-05).
 */
export const ResearchPiAggregateBoard = observer(function ResearchPiAggregateBoard({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [aggregate, setAggregate] = useState<TPiAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setAggregate(await accountService.getPiAggregate(workspaceSlug));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

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
  const cards = [
    {
      key: "projects",
      label: t("research.pi.cards.projects"),
      value: aggregate.projects.total,
      detail: Object.entries(aggregate.projects.by_status)
        .map(([status, count]) => `${t(`research.project_status.${status.toLowerCase()}`)} ${count}`)
        .join(" · "),
      href: `/${source}/research/projects`,
    },
    {
      key: "reports",
      label: t("research.pi.cards.reports"),
      value: aggregate.reports.total,
      detail: `${t("research.pi.cards.pending_review")} ${
        aggregate.reports.by_status.SUBMITTED ?? 0
      } · 30d ${aggregate.reports.submitted_last_30_days}`,
      href: `/${source}/research/reports`,
    },
    {
      key: "stages",
      label: t("research.pi.cards.stages"),
      value: aggregate.stages.total,
      detail: `${t("research.pi.cards.blocked")} ${aggregate.stages.blocked_gates}`,
      href: `/${source}/research/reviews`,
    },
    {
      key: "reviews",
      label: t("research.pi.cards.reviews"),
      value: aggregate.reviews.awaiting_stages,
      detail: `${t("research.pi.cards.open_assignments")} ${aggregate.reviews.open_assignments}`,
      href: `/${source}/research/reviews`,
    },
    {
      key: "approvals",
      label: t("research.pi.cards.approvals"),
      value: aggregate.approvals.pending,
      detail: t("research.pi.cards.pending_only"),
      href: `/${source}/research/approvals`,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-12 text-tertiary">
          {t("research.pi.scope_summary", {
            units: aggregate.scope.unit_count,
            workspace: aggregate.source_workspace.name,
          })}
        </p>
        <span className="text-11 text-tertiary">
          {t("research.pi.generated_at")} {new Date(aggregate.generated_at).toLocaleString()}
        </span>
      </div>

      {aggregate.scope.is_empty ? (
        <p className="rounded-md border border-subtle p-4 text-12 text-tertiary">{t("research.pi.empty_scope")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="flex flex-col gap-1 rounded-md border border-subtle p-4 transition-colors hover:bg-surface-2"
            >
              <span className="text-12 text-tertiary">{card.label}</span>
              <span className="text-20 font-medium text-primary">{card.value}</span>
              <span className="text-11 text-tertiary">{card.detail}</span>
            </Link>
          ))}
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
    </div>
  );
});

export default ResearchPiAggregateBoard;
