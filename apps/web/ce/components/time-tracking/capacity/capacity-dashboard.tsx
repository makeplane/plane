/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useWorklog } from "@/hooks/store/use-worklog";
import { Spinner } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";
import { Switch } from "@plane/propel/switch";

// plane components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";

// import { CapacitySummaryCards } from "./capacity-summary-cards"; // TODO: hidden for future
import { CapacityHeatmap } from "./capacity-heatmap";

import { download, generateCsv, mkConfig } from "export-to-csv";
import { format } from "date-fns";

interface ICapacityDashboardProps {
  workspaceSlug: string;
  projectId?: string;
  /** When true, component is rendered at workspace level (no projectId required).
   *  The cross-workspace toggle is shown; default is current workspace only. */
  isWorkspaceMode?: boolean;
}

export const CapacityDashboard = observer((props: ICapacityDashboardProps) => {
  const { workspaceSlug, projectId, isWorkspaceMode } = props;
  if (!projectId && !isWorkspaceMode) {
    throw new Error("CapacityDashboard requires either projectId or isWorkspaceMode");
  }
  const { t } = useTranslation();
  const worklogStore = useWorklog();
  const { capacityData, isCapacityLoading } = worklogStore;

  // Filter state
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  // Workspace mode defaults to current-workspace-only (toggle OFF)
  const [isCrossWorkspace, setIsCrossWorkspace] = useState(false);

  // Derived date params
  const dateFrom = dateRange.from ? renderFormattedPayloadDate(dateRange.from) || "" : "";
  const dateTo = dateRange.to ? renderFormattedPayloadDate(dateRange.to) || "" : "";

  const fetchReport = useCallback(() => {
    if (!workspaceSlug) return;
    if (!projectId && !isWorkspaceMode) return;

    const params: Record<string, string> = {};
    if (selectedMembers.length > 0) params["member_id"] = selectedMembers.join(",");
    if (dateFrom) params["date_from"] = dateFrom;
    if (dateTo) params["date_to"] = dateTo;
    if (isCrossWorkspace) params["cross_workspace"] = "true";

    if (isWorkspaceMode) {
      // Workspace members, time from current workspace (or all workspaces if cross_workspace=true)
      void worklogStore.fetchWorkspaceAnalyticsCapacity(workspaceSlug, params);
    } else {
      // Project members, time from current project (or all workspaces if cross_workspace=true)
      void worklogStore.fetchCapacityReport(workspaceSlug, projectId!, params);
    }
  }, [workspaceSlug, projectId, isWorkspaceMode, selectedMembers, dateFrom, dateTo, isCrossWorkspace, worklogStore]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // TODO: Category distribution (project-scoped) — hidden for future implementation
  // useEffect(() => {
  //   if (isCrossWorkspace || !workspaceSlug || !projectId) return;
  //   const params: Record<string, string> = {};
  //   if (dateFrom) params["date_from"] = dateFrom;
  //   if (dateTo) params["date_to"] = dateTo;
  //   void worklogStore.fetchCapacityCategories(workspaceSlug, projectId, params);
  // }, [workspaceSlug, projectId, dateFrom, dateTo, isCrossWorkspace, worklogStore]);

  const handleExport = () => {
    if (!capacityData) return;

    const csvConfig = mkConfig({
      fieldSeparator: ",",
      filename: `${workspaceSlug}-capacity-report-${format(new Date(), "yyyy-MM-dd")}`,
      decimalSeparator: ".",
      useKeysAsHeaders: true,
    });

    const exportData = capacityData.members.map((member) => ({
      "Member Name": member.display_name,
      "Total Logged (h)": (member.total_logged_minutes / 60).toFixed(2),
      ...Object.keys(member.days || {}).reduce<Record<string, string>>((acc, date) => {
        acc[date] = (((member.days && member.days[date]) || 0) / 60).toFixed(2);
        return acc;
      }, {}),
    }));

    const csv = generateCsv(csvConfig)(exportData as Array<Record<string, string>>);
    download(csvConfig)(csv);
  };

  if (isCapacityLoading && !capacityData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!capacityData) {
    return (
      <div className="flex h-full w-full items-center justify-center text-13 text-secondary">
        {t("capacity_no_data")}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-1">
      {/* Title & Description Block */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-primary flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              {t("capacity_dashboard")}
            </h2>
            <p className="text-13 text-secondary mt-1.5 ml-0.5">{t("capacity_dashboard_description")}</p>
          </div>

          {/* Cross Workspaces switch */}
          <div className="flex items-center gap-2.5">
            <span className="text-12 font-medium text-secondary">{t("timesheet_cross_workspaces")}</span>
            <Switch value={isCrossWorkspace} onChange={(val) => setIsCrossWorkspace(val)} size="sm" />
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto vertical-scrollbar">
        {/* TODO: Category summary charts — hidden for future implementation */}
        {/* {!isCrossWorkspace && (
          <div className="px-6 mb-4 text-primary">
            <CapacitySummaryCards
              totalLoggedMinutes={capacityData.project_total_logged}
              categoriesData={worklogStore.categoriesData}
            />
          </div>
        )} */}

        {/* Filters Bar */}
        <div className="px-6 py-2 border-y border-subtle bg-surface-2/30 flex items-center justify-between sticky top-0 z-[22] backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Member filter — shown only when in project mode and not cross-workspace */}
            {projectId && !isCrossWorkspace ? (
              <div className="flex items-center gap-2">
                <span className="text-12 font-medium text-secondary">{t("common.assignee")}:</span>
                <MemberDropdown
                  value={selectedMembers}
                  onChange={(val: string[]) => setSelectedMembers(val)}
                  projectId={projectId}
                  multiple
                  buttonVariant="transparent-with-text"
                  buttonClassName="!h-7 !px-2.5 !py-0.5 text-12"
                  dropdownArrow
                />
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <span className="text-12 font-medium text-secondary">{t("date_range")}:</span>
              <DateRangeDropdown
                buttonVariant="transparent-with-text"
                value={dateRange}
                onSelect={(range) =>
                  setDateRange(
                    range ? { from: range.from, to: range.to || undefined } : { from: undefined, to: undefined }
                  )
                }
                buttonClassName="!h-7 !px-2.5 !py-0.5 text-12"
                isClearable
                renderInPortal
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1 rounded-md bg-accent-primary text-white text-12 font-medium hover:bg-accent-primary/90 transition-colors shadow-sm"
            >
              {t("export")}
            </button>
          </div>
        </div>

        <div className="p-6 relative min-h-[400px]">
          {isCapacityLoading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-1/60 backdrop-blur-[2px] rounded-xl transition-all">
              <div className="flex flex-col items-center gap-2">
                <Spinner />
                <span className="text-13 font-medium text-secondary animate-pulse">{t("common.loading")}...</span>
              </div>
            </div>
          )}
          <CapacityHeatmap
            key={capacityData.members.length + (capacityData.date_from || "") + (capacityData.date_to || "")}
            members={capacityData.members}
            dateFrom={capacityData.date_from}
            dateTo={capacityData.date_to}
            projectDailyTotals={capacityData.project_daily_totals}
            workspaceSlug={workspaceSlug}
            projectId={projectId ?? ""}
            isCrossWorkspace={isCrossWorkspace}
            isWorkspaceMode={isWorkspaceMode}
          />
        </div>
      </div>
    </div>
  );
});
