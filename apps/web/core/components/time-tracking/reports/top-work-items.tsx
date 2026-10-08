/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TTimeEntryFilters } from "@plane/types";
// hooks
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeReport } from "@/hooks/time-tracking/use-time-report";
// local imports
import { TimeTrackingRowsLoader } from "../loaders";
import type { TTimeUnits } from "./report-helpers";
import { formatUnits } from "./report-helpers";

const LIMIT = 20;

type Props = {
  workspaceSlug: string;
  filters: TTimeEntryFilters;
  units: TTimeUnits;
  onDrillDown: (patches: TTimeTrackingFilterPatch[]) => void;
};

/** The work items with the most time (plan 9.5.4 §5). People come from a per-person sub-grouping. */
export const TopWorkItems = observer(function TopWorkItems({ workspaceSlug, filters, units, onDrillDown }: Props) {
  const { t } = useTranslation();
  const params = useMemo(() => ({ group_by: "issue" as const, sub_group_by: "user" as const }), []);
  const { report, isLoading } = useTimeReport(workspaceSlug, filters, params);
  const rows = (report?.groups ?? []).filter((group) => group.key !== null).slice(0, LIMIT);

  return (
    <section className="flex flex-col gap-3 rounded-md border-[0.5px] border-subtle p-4">
      <h3 className="text-14 font-medium text-primary">{t("time-tracking.reports.top_work_items")}</h3>
      {isLoading && !report ? (
        <TimeTrackingRowsLoader rows={5} />
      ) : (
        <table className="w-full border-collapse text-13">
          <thead>
            <tr className="border-b border-subtle text-tertiary">
              <th className="h-9 px-2 text-left font-medium">{t("time-tracking.reports.columns.work_item")}</th>
              <th className="px-2 text-right font-medium">{t("time-tracking.reports.columns.total")}</th>
              <th className="px-2 text-right font-medium">{t("time-tracking.reports.columns.billable")}</th>
              <th className="px-2 text-right font-medium">{t("time-tracking.reports.columns.people")}</th>
              <th className="px-2 text-right font-medium">{t("time-tracking.reports.columns.entries")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((group) => (
              <tr
                key={group.key}
                onClick={() => onDrillDown([{ issue_ids: [group.key as string] }])}
                className="cursor-pointer border-b border-subtle hover:bg-layer-1-hover"
              >
                <td className="max-w-96 truncate px-2 py-1.5 text-primary">{group.label}</td>
                <td className="px-2 text-right font-medium tabular-nums">{formatUnits(group.total_seconds, units)}</td>
                <td className="px-2 text-right text-secondary tabular-nums">
                  {formatUnits(group.billable_seconds, units)}
                </td>
                <td className="px-2 text-right text-secondary tabular-nums">{group.sub_groups?.length ?? 0}</td>
                <td className="px-2 text-right text-secondary tabular-nums">{group.entry_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
});
