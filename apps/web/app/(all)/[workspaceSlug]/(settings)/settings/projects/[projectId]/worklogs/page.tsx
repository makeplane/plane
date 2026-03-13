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
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
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
import { getWorklogColumns } from "./worklog-table-columns";
import { WorklogFiltersToolbar } from "./worklog-filters-toolbar";
import { WorklogPaginationFooter } from "./worklog-pagination-footer";
import { PreviousDownloads } from "./previous-downloads";

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
  const [isPreviousDownloadsOpen, setIsPreviousDownloadsOpen] = useState(false);

  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();
  const projectWorklogs = useProjectWorklogs();

  const canPerformProjectAdminActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const filterParams = useMemo(() => buildFilterParams(selectedUsers, dateRange), [selectedUsers, dateRange]);

  // Fetch worklogs with current filters
  useEffect(() => {
    if (workspaceSlug && projectId) {
      void projectWorklogs.fetchWorklogs(workspaceSlug, projectId, filterParams);
    }
  }, [workspaceSlug, projectId, projectWorklogs, filterParams]);

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (workspaceSlug && projectId) {
      void projectWorklogs.fetchPage(workspaceSlug, projectId, "next", filterParams);
    }
  }, [workspaceSlug, projectId, projectWorklogs, filterParams]);

  const handlePrevPage = useCallback(() => {
    if (workspaceSlug && projectId) {
      void projectWorklogs.fetchPage(workspaceSlug, projectId, "prev", filterParams);
    }
  }, [workspaceSlug, projectId, projectWorklogs, filterParams]);

  // Async export handler
  const handleExport = useCallback(
    async (provider: "csv" | "xlsx") => {
      if (!workspaceSlug || !projectId) return;
      try {
        await projectWorklogs.triggerExport(workspaceSlug, projectId, provider, filterParams);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Export started",
          message: "Check Previous Downloads when ready.",
        });
        setIsPreviousDownloadsOpen(true);
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Export failed",
          message: "Something went wrong. Please try again.",
        });
      }
    },
    [workspaceSlug, projectId, projectWorklogs, filterParams]
  );

  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Worklogs` : undefined;
  const worklogs = useMemo(
    () => (projectId ? projectWorklogs.worklogs[projectId] : []) || [],
    [projectId, projectWorklogs.worklogs]
  );
  const columns = useMemo(() => getWorklogColumns(projectDetails?.name), [projectDetails?.name]);

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
          onExport={(provider) => void handleExport(provider)}
        />
        <div className="mt-6 flex flex-col w-full">
          {projectWorklogs.isLoading && worklogs.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center text-tertiary">Loading...</div>
          ) : worklogs.length > 0 ? (
            <div className="w-full overflow-hidden flex flex-col">
              <Table
                data={worklogs}
                columns={columns}
                keyExtractor={(log: IWorkLog) => log.id}
                tableClassName="w-full border-t border-subtle"
                tHeadTrClassName="!divide-x-0 border-b border-subtle !bg-transparent"
                tBodyTrClassName="!divide-x-0 border-b border-subtle py-2 hover:bg-layer-1-hover"
                thClassName="text-left py-3 px-5 font-normal"
                tdClassName="py-3 px-5"
              />
              <WorklogPaginationFooter
                rangeStart={projectWorklogs.rangeStart}
                rangeEnd={projectWorklogs.rangeEnd}
                totalCount={projectWorklogs.totalCount}
                hasNext={projectWorklogs.hasMore}
                hasPrev={projectWorklogs.hasPrev}
                isLoading={projectWorklogs.isLoading}
                onNext={handleNextPage}
                onPrev={handlePrevPage}
              />
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
        <PreviousDownloads
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={isPreviousDownloadsOpen}
          onToggle={() => setIsPreviousDownloadsOpen((prev) => !prev)}
        />
      </section>
    </SettingsContentWrapper>
  );
}

const ObserverWorklogSettingsPage = observer(WorklogSettingsPage);
export default ObserverWorklogSettingsPage;
