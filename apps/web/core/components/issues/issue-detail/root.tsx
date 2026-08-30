/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// assets
import emptyIssue from "@/app/assets/empty-state/issue.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// local components
import { IssuePeekOverview } from "../peek-overview";
import { IssueMainContent } from "./main-content";
import { IssueDetailsSidebar } from "./sidebar";

export type TIssueOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string, loader?: boolean) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archive?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  restore?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  addCycleToIssue?: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addIssueToCycle?: (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromCycle?: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  removeIssueFromModule?: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueId: string
  ) => Promise<void>;
  changeModulesInIssue?: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => Promise<void>;
};

export type TIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  is_archived?: boolean;
};

export const IssueDetailRoot = observer(function IssueDetailRoot(props: TIssueDetailRoot) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId, issueId, is_archived = false } = props;
  // router
  const router = useAppRouter();
  // hooks
  const {
    issue: { getIssueById },
    fetchIssue,
    updateIssue,
    removeIssue,
    archiveIssue,
    addCycleToIssue,
    addIssueToCycle,
    removeIssueFromCycle,
    changeModulesInIssue,
    removeIssueFromModule,
  } = useIssueDetail();
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { allowPermissions } = useUserPermissions();
  const { issueDetailSidebarCollapsed } = useAppTheme();
  const { fetchProjectDetails } = useProject();

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      // oxlint-disable-next-line no-shadow
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error fetching the parent issue:", error);
        }
      },
      // oxlint-disable-next-line no-shadow
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
        } catch (error) {
          console.log("Error in updating issue:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: t("issue.label") }),
          });
        }
      },
      // oxlint-disable-next-line no-shadow
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (is_archived) await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else await removeIssue(workspaceSlug, projectId, issueId);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("entity.delete.success", { entity: t("issue.label") }),
          });
        } catch (error) {
          console.log("Error in deleting issue:", error);
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.delete.failed", { entity: t("issue.label") }),
          });
        }
      },
      // oxlint-disable-next-line no-shadow
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.log("Error in archiving issue:", error);
        }
      },
      // oxlint-disable-next-line no-shadow
      addCycleToIssue: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          await addCycleToIssue(workspaceSlug, projectId, cycleId, issueId);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("common.error.label"),
            message: t("issue.add.cycle.failed"),
          });
        }
      },
      // oxlint-disable-next-line no-shadow
      addIssueToCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) => {
        try {
          await addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("common.error.label"),
            message: t("issue.add.cycle.failed"),
          });
        }
      },
      // oxlint-disable-next-line no-shadow
      removeIssueFromCycle: async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
        try {
          const removeFromCyclePromise = removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
          setPromiseToast(removeFromCyclePromise, {
            loading: t("issue.remove.cycle.loading"),
            success: {
              title: t("common.success"),
              message: () => t("issue.remove.cycle.success"),
            },
            error: {
              title: t("common.error.label"),
              message: () => t("issue.remove.cycle.failed"),
            },
          });
          await removeFromCyclePromise;
        } catch (error) {
          console.log("Error in removing issue from cycle:", error);
        }
      },
      // oxlint-disable-next-line no-shadow
      removeIssueFromModule: async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) => {
        try {
          const removeFromModulePromise = removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
          setPromiseToast(removeFromModulePromise, {
            loading: t("issue.remove.module.loading"),
            success: {
              title: t("common.success"),
              message: () => t("issue.remove.module.success"),
            },
            error: {
              title: t("common.error.label"),
              message: () => t("issue.remove.module.failed"),
            },
          });
          await removeFromModulePromise;
        } catch (error) {
          console.log("Error in removing issue from module:", error);
        }
      },
      changeModulesInIssue: async (
        // oxlint-disable-next-line no-shadow
        workspaceSlug: string,
        // oxlint-disable-next-line no-shadow
        projectId: string,
        // oxlint-disable-next-line no-shadow
        issueId: string,
        addModuleIds: string[],
        removeModuleIds: string[]
      ) => {
        const promise = await changeModulesInIssue(workspaceSlug, projectId, issueId, addModuleIds, removeModuleIds);
        return promise;
      },
    }),
    [
      is_archived,
      fetchIssue,
      updateIssue,
      removeIssue,
      archiveIssue,
      removeArchivedIssue,
      addIssueToCycle,
      addCycleToIssue,
      removeIssueFromCycle,
      changeModulesInIssue,
      removeIssueFromModule,
      t,
    ]
  );

  // issue details
  const issue = getIssueById(issueId);
  // checking if issue is editable, based on user role
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  // The workspace wrapper only loads lite project data (which omits feature
  // flags like is_time_tracking_enabled), so fetch the full project details to
  // power the sidebar's feature-gated rows (time tracking, modules, cycles).
  useSWR(
    workspaceSlug && projectId ? ["issue_detail_project", workspaceSlug, projectId] : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <>
      {!issue ? (
        <EmptyState
          image={emptyIssue}
          title={t("issue.empty_state.issue_detail.title")}
          description={t("issue.empty_state.issue_detail.description")}
          primaryButton={{
            text: t("issue.empty_state.issue_detail.primary_button.text"),
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/issues`),
          }}
        />
      ) : (
        <div className="flex h-full w-full overflow-hidden">
          <div className="h-full w-full space-y-6 overflow-y-auto px-9 py-5">
            <IssueMainContent
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              isEditable={isEditable}
              isArchived={is_archived}
            />
          </div>
          <div
            className="fixed right-0 z-[5] h-full w-full min-w-[300px] border-l border-subtle bg-surface-1 sm:w-1/2 md:relative md:w-1/4 lg:min-w-80 xl:min-w-96"
            style={issueDetailSidebarCollapsed ? { right: `-${window?.innerWidth || 0}px` } : {}}
          >
            <IssueDetailsSidebar
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              isEditable={!is_archived && isEditable}
            />
          </div>
        </div>
      )}

      {/* peek overview */}
      <IssuePeekOverview />
    </>
  );
});
