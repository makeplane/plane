/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { format as formatDateTime } from "date-fns";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkLog } from "@plane/types";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Table } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectWorklogs } from "@/plane-web/hooks/store/use-project-worklog";
// local
import { WorklogsProjectSettingsHeader } from "./header";
import { getWorklogColumns, formatMinutesToHours } from "./worklog-table-columns";
import { WorklogFiltersToolbar } from "./worklog-filters-toolbar";

// Trigger browser download of a CSV string
const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Build filter params from current filter state
const buildFilterParams = (
  selectedUsers: string[],
  dateRange: { from: Date | undefined; to: Date | undefined }
): Record<string, string> => {
  const params: Record<string, string> = {};
  if (selectedUsers.length) params.member_id = selectedUsers.join(",");
  if (dateRange.from) params.date_from = formatDateTime(dateRange.from, "yyyy-MM-dd");
  if (dateRange.to) params.date_to = formatDateTime(dateRange.to, "yyyy-MM-dd");
  return params;
};

function WorklogSettingsPage() {
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();

  // filter state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();
  const projectWorklogs = useProjectWorklogs();

  const canPerformProjectAdminActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  // Fetch worklogs with current filters
  useEffect(() => {
    if (workspaceSlug && projectId) {
      const params = buildFilterParams(selectedUsers, dateRange);
      void projectWorklogs.fetchWorklogs(workspaceSlug, projectId, params);
    }
  }, [workspaceSlug, projectId, projectWorklogs, selectedUsers, dateRange]);

  // Load more handler for pagination
  const handleLoadMore = useCallback(() => {
    if (workspaceSlug && projectId && projectWorklogs.hasMore && !projectWorklogs.isLoading) {
      const params = buildFilterParams(selectedUsers, dateRange);
      void projectWorklogs.fetchWorklogs(workspaceSlug, projectId, params, true);
    }
  }, [workspaceSlug, projectId, projectWorklogs, selectedUsers, dateRange]);

  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Worklogs` : undefined;
  const worklogs = useMemo(
    () => (projectId ? projectWorklogs.worklogs[projectId] : []) || [],
    [projectId, projectWorklogs.worklogs]
  );
  const columns = useMemo(() => getWorklogColumns(projectDetails?.name), [projectDetails?.name]);

  // CSV export handler
  const handleExportCSV = useCallback(() => {
    if (!worklogs.length) return;
    const header = "Issue,Logged By,Duration,Date,Description";
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = worklogs.map((w: IWorkLog) =>
      [
        esc(w.issue_detail?.identifier || ""),
        esc(w.logged_by_detail?.display_name || ""),
        formatMinutesToHours(w.duration_minutes),
        w.logged_at || "",
        esc(w.description || ""),
      ].join(",")
    );
    const projectName = projectDetails?.name || "project";
    downloadCSV([header, ...rows].join("\n"), `${projectName}-worklogs.csv`);
  }, [worklogs, projectDetails?.name]);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }
  if (!workspaceSlug || !projectId) return null;

  return (
    <SettingsContentWrapper header={<WorklogsProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading title="Worklogs" description="Download worklogs AKA timesheets for anyone in any project." />
        <WorklogFiltersToolbar
          projectId={projectId}
          selectedUsers={selectedUsers}
          onSelectedUsersChange={setSelectedUsers}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onExportCSV={handleExportCSV}
        />
        <div className="mt-6 flex flex-col w-full">
          {projectWorklogs.isLoading && worklogs.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center text-color-tertiary">Loading...</div>
          ) : worklogs.length > 0 ? (
            <div className="w-full overflow-hidden flex flex-col">
              <Table
                data={worklogs}
                columns={columns}
                keyExtractor={(log: IWorkLog) => log.id}
                tableClassName="w-full border-t border-color-subtle"
                tHeadTrClassName="!divide-x-0 border-b border-color-subtle !bg-transparent"
                tBodyTrClassName="!divide-x-0 border-b border-color-subtle py-2 hover:bg-layer-1-hover"
                thClassName="text-left py-3 px-5 font-normal"
                tdClassName="py-3 px-5"
              />
              <div className="mt-4 flex items-center justify-end text-sm text-color-secondary p-5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!projectWorklogs.hasMore || projectWorklogs.isLoading}
                  onClick={handleLoadMore}
                >
                  {projectWorklogs.isLoading ? "Loading..." : "Load more"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full mt-10">
              <EmptyStateCompact
                title={t("project_settings.worklogs.empty_title")}
                description={t("project_settings.worklogs.empty_description")}
                assetKey="project"
              />
            </div>
          )}
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

const ObserverWorklogSettingsPage = observer(WorklogSettingsPage);
export default ObserverWorklogSettingsPage;
