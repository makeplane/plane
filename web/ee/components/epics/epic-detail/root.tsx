"use client";

import { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { EIssueServiceType, EIssuesStoreType } from "@plane/constants";
// types
import { TIssue } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
import { IssuePeekOverview } from "@/components/issues";
// constants
import { ISSUE_UPDATED, ISSUE_DELETED, ISSUE_ARCHIVED } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useIssueDetail, useIssues, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { EpicDetailsSidebar } from "@/plane-web/components/epics/sidebar/root";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { useIssueTypes } from "@/plane-web/hooks/store";
// images
import emptyIssue from "@/public/empty-state/issue.svg";
import { EpicMainContentRoot } from "./main-content";

export type TIssueOperations = {
  fetch: (workspaceSlug: string, projectId: string, issueId: string, loader?: boolean) => Promise<void>;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  archive?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  restore?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
};

export type TIssueDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  is_archived?: boolean;
};

export const EpicDetailRoot: FC<TIssueDetailRoot> = observer((props) => {
  const { workspaceSlug, projectId, epicId, is_archived = false } = props;
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  // hooks
  const { fetchEpicAnalytics } = useIssueTypes();
  const {
    issue: { getIssueById },
    fetchIssue,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { updateIssue, removeIssue, archiveIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { captureIssueEvent } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  useSWR(
    workspaceSlug && projectId && epicId ? `EPIC_ANALYTICS_${workspaceSlug}_${projectId}_${epicId}` : null,
    workspaceSlug && projectId && epicId
      ? () => fetchEpicAnalytics(workspaceSlug.toString(), projectId.toString(), epicId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error fetching the parent issue:", error);
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          if (updateIssue) {
            await updateIssue(projectId, issueId, data);
            captureIssueEvent({
              eventName: ISSUE_UPDATED,
              payload: { ...data, issueId, state: "SUCCESS", element: "Issue detail page" },
              updates: {
                changed_property: Object.keys(data).join(","),
                change_details: Object.values(data).join(","),
              },
              path: pathname,
            });
          }
        } catch (error) {
          console.log("Error in updating issue:", error);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (is_archived) await removeArchivedIssue(workspaceSlug, projectId, issueId);
          else if (removeIssue) await removeIssue(projectId, issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            path: pathname,
          });
        } catch (error) {
          console.log("Error in deleting issue:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          if (archiveIssue) {
            await archiveIssue(projectId, issueId);
            captureIssueEvent({
              eventName: ISSUE_ARCHIVED,
              payload: { id: issueId, state: "SUCCESS", element: "Issue details page" },
              path: pathname,
            });
          }
        } catch (error) {
          console.log("Error in archiving issue:", error);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "FAILED", element: "Issue details page" },
            path: pathname,
          });
        }
      },
    }),
    [is_archived, fetchIssue, updateIssue, removeIssue, archiveIssue, removeArchivedIssue, captureIssueEvent, pathname]
  );

  // issue details
  const issue = getIssueById(epicId);
  // checking if issue is editable, based on user role
  const isEditable = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

  return (
    <>
      {!issue ? (
        <EmptyState
          image={emptyIssue}
          title="Epic does not exist"
          description="The epic you are looking for does not exist, has been archived, or has been deleted."
          primaryButton={{
            text: "View other epics",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/epics`),
          }}
        />
      ) : (
        <div className="flex h-full w-full overflow-hidden">
          <EpicMainContentRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            issueOperations={issueOperations}
            isEditable={!is_archived && isEditable}
            isArchived={is_archived}
          />

          <EpicDetailsSidebar
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            issueOperations={issueOperations}
            isEditable={!is_archived && isEditable}
          />
        </div>
      )}

      {/* peek overview */}
      <IssuePeekOverview storeType={EIssuesStoreType.PROJECT} />
    </>
  );
});
