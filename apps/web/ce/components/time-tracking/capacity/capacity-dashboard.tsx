/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Spinner } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";
import { Switch } from "@plane/propel/switch";
import { BarChart2, Download } from "lucide-react";

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
      <div className="px-8 pt-8 pb-6 shrink-0 bg-gradient-to-b from-surface-1 to-surface-2/20">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary shadow-sm ring-1 ring-accent-primary/20">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-primary leading-tight">
                  {t("capacity_dashboard")}
                </h2>
                <p className="text-14 text-secondary mt-1 font-medium italic opacity-80 line-clamp-1">
                  {t("capacity_dashboard_description")}
                </p>
              </div>
            </div>
          </div>

          {/* Cross Workspaces switch with better layout */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-2 border border-subtle shadow-sm">
              <span className="text-12 font-semibold text-secondary uppercase tracking-wider">
                {t("timesheet_cross_workspaces")}
              </span>
              <Switch value={isCrossWorkspace} onChange={(val) => setIsCrossWorkspace(val)} size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar">
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
        <div className="mx-8 mb-2 px-4 py-2.5 border border-subtle bg-surface-1 rounded-xl flex items-center justify-between sticky top-0 z-10 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-6">
            {/* Member filter — shown only when in project mode and not cross-workspace */}
            {projectId && !isCrossWorkspace ? (
              <div className="flex items-center gap-2.5 whitespace-nowrap">
                <span className="text-12 font-bold text-tertiary uppercase tracking-wider">
                  {t("common.assignee")}:
                </span>
                <MemberDropdown
                  value={selectedMembers}
                  onChange={(val: string[]) => setSelectedMembers(val)}
                  projectId={projectId}
                  multiple
                  buttonVariant="transparent-with-text"
                  buttonClassName="!h-8 !px-3 !py-1 text-13 font-medium bg-surface-2 hover:bg-surface-1 border border-transparent hover:border-subtle rounded-md transition-all"
                  dropdownArrow
                />
              </div>
            ) : null}

            <div className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="text-12 font-bold text-tertiary uppercase tracking-wider">{t("date_range")}:</span>
              <DateRangeDropdown
                buttonVariant="transparent-with-text"
                value={dateRange}
                onSelect={(range) =>
                  setDateRange(
                    range ? { from: range.from, to: range.to || undefined } : { from: undefined, to: undefined }
                  )
                }
                buttonClassName="!h-8 !px-3 !py-1 text-13 font-medium bg-surface-2 hover:bg-surface-1 border border-transparent hover:border-subtle rounded-md transition-all"
                isClearable
              />
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-on-primary text-13 font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              <Download className="h-4 w-4" />
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
