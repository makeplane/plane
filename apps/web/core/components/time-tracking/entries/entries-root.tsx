/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TIME_ENTRY_DEFAULT_ORDER_BY, TIME_ENTRY_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TTimeEntryOrderBy } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// hooks
import { useLoggableProjects } from "@/hooks/time-tracking/use-loggable-projects";
import { useTimeEntries } from "@/hooks/time-tracking/use-time-entries";
import { useTimeSummary } from "@/hooks/time-tracking/use-time-summary";
import { useTimeTrackingFilters } from "@/hooks/time-tracking/use-time-tracking-filters";
// local imports
import { TimeEntriesEmptyState } from "../empty-states";
import { TimeTrackingFiltersBar } from "../filters/filters-bar";
import { TimeTrackingRowsLoader } from "../loaders";
import { TimeEntriesBulkActionsBar } from "./bulk-actions-bar";
import type { TEntriesGroupBy } from "./entries-table";
import { TimeEntriesTable } from "./entries-table";
import { TimeEntriesSummaryStrip } from "./summary-strip";

const GROUP_BY_OPTIONS: { key: TEntriesGroupBy; i18n_label: string }[] = [
  { key: "none", i18n_label: "time-tracking.entries.group_none" },
  { key: "day", i18n_label: "time-tracking.entries.group_day" },
  { key: "person", i18n_label: "time-tracking.entries.group_person" },
  { key: "project", i18n_label: "time-tracking.entries.group_project" },
  { key: "work_item", i18n_label: "time-tracking.entries.group_work_item" },
];

/** The Entries tab: filters, summary, grouping, the table and bulk actions (plan 9.5.3). */
export const EntriesRoot = observer(function EntriesRoot({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const { filters, apiFilters, setFilters } = useTimeTrackingFilters();
  const { ownProjectIds } = useLoggableProjects(workspaceSlug);
  const { summary } = useTimeSummary(workspaceSlug, apiFilters);
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } = useTimeEntries(workspaceSlug, apiFilters);
  const [groupBy, setGroupBy] = useState<TEntriesGroupBy>("none");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // a new filter set starts with nothing selected
  useEffect(() => setSelectedIds(new Set()), [apiFilters]);

  const orderBy = filters.order_by ?? TIME_ENTRY_DEFAULT_ORDER_BY;

  return (
    <div className="flex flex-col gap-4 px-page-x py-4">
      <TimeTrackingFiltersBar workspaceSlug={workspaceSlug} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TimeEntriesSummaryStrip summary={summary} />
        <div className="flex items-center gap-2 text-13">
          <span className="text-tertiary">{t("time-tracking.entries.group_by")}</span>
          <CustomSelect
            value={groupBy}
            onChange={(value: TEntriesGroupBy) => setGroupBy(value)}
            label={t(GROUP_BY_OPTIONS.find((option) => option.key === groupBy)?.i18n_label ?? "")}
            buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
          >
            {GROUP_BY_OPTIONS.map((option) => (
              <CustomSelect.Option key={option.key} value={option.key}>
                {t(option.i18n_label)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <span className="text-tertiary">{t("time-tracking.entries.sort_by")}</span>
          <CustomSelect
            value={orderBy}
            onChange={(value: TTimeEntryOrderBy) =>
              setFilters({ order_by: value === TIME_ENTRY_DEFAULT_ORDER_BY ? null : value })
            }
            label={t(TIME_ENTRY_ORDER_BY_OPTIONS.find((option) => option.key === orderBy)?.i18n_label ?? "")}
            buttonClassName="h-7 rounded-md border-[0.5px] border-subtle-1 px-2"
          >
            {TIME_ENTRY_ORDER_BY_OPTIONS.map((option) => (
              <CustomSelect.Option key={option.key} value={option.key}>
                {t(option.i18n_label)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>
      </div>

      <TimeEntriesBulkActionsBar
        workspaceSlug={workspaceSlug}
        selectedIds={Array.from(selectedIds)}
        onDone={() => setSelectedIds(new Set())}
      />

      {isLoading && entries.length === 0 ? (
        <TimeTrackingRowsLoader />
      ) : entries.length === 0 ? (
        <TimeEntriesEmptyState canLog={ownProjectIds.length > 0} />
      ) : (
        <div className="overflow-x-auto rounded-md border-[0.5px] border-subtle">
          <TimeEntriesTable
            workspaceSlug={workspaceSlug}
            entries={entries}
            groupBy={groupBy}
            isPartial={hasMore}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" size="lg" loading={isLoadingMore} onClick={() => void loadMore()}>
            {t("time-tracking.entries.load_more")}
          </Button>
        </div>
      )}
    </div>
  );
});
