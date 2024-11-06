"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { ArchiveIcon, ArchiveRestoreIcon, LinkIcon, Trash2 } from "lucide-react";
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { ArchiveIssueModal, DeleteIssueModal, IssueSubscription } from "@/components/issues";
// constants
import { ISSUE_ARCHIVED, ISSUE_DELETED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
import { ARCHIVABLE_STATE_GROUPS } from "@/constants/state";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import {
  useEventTracker,
  useIssueDetail,
  useIssues,
  useProjectState,
  useUser,
  useUserPermissions,
} from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const IssueDetailQuickActions: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;

  // states
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [archiveIssueModal, setArchiveIssueModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // router
  const router = useAppRouter();

  // hooks
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();
  const { getStateById } = useProjectState();
  const {
    issue: { getIssueById },
    removeIssue,
    archiveIssue,
  } = useIssueDetail();
  const {
    issues: { restoreIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { captureIssueEvent } = useEventTracker();
  const pathname = usePathname();

  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const stateDetails = getStateById(issue.state_id);

  // handlers
  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const handleDeleteIssue = async () => {
    try {
      const deleteIssue = issue?.archived_at ? removeArchivedIssue : removeIssue;
      const redirectionPath = issue?.archived_at
        ? `/${workspaceSlug}/projects/${projectId}/archives/issues`
        : `/${workspaceSlug}/projects/${projectId}/issues`;

      return deleteIssue(workspaceSlug, projectId, issueId).then(() => {
        router.push(redirectionPath);
        captureIssueEvent({
          eventName: ISSUE_DELETED,
          payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
          path: pathname,
        });
      });
    } catch (error) {
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
  };

  const handleArchiveIssue = async () => {
    try {
      await archiveIssue(workspaceSlug, projectId, issueId).then(() => {
        router.push(`/${workspaceSlug}/projects/${projectId}/archives/issues/${issue.id}`);
      });
      captureIssueEvent({
        eventName: ISSUE_ARCHIVED,
        payload: { id: issueId, state: "SUCCESS", element: "Issue details page" },
        path: pathname,
      });
    } catch (error) {
      captureIssueEvent({
        eventName: ISSUE_ARCHIVED,
        payload: { id: issueId, state: "FAILED", element: "Issue details page" },
        path: pathname,
      });
    }
  };

  const handleRestore = async () => {
    if (!workspaceSlug || !projectId || !issueId) return;

    setIsRestoring(true);

    await restoreIssue(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your issue can be found in project issues.",
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/issues/${issueId}`);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Issue could not be restored. Please try again.",
        });
      })
      .finally(() => setIsRestoring(false));
  };

  // auth
  const isEditable = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);
  const canRestoreIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const isArchivingAllowed = !issue?.archived_at && isEditable;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);

  return (
    <>
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issue}
        onSubmit={handleDeleteIssue}
      />
      <ArchiveIssueModal
        isOpen={archiveIssueModal}
        handleClose={() => setArchiveIssueModal(false)}
        data={issue}
        onSubmit={handleArchiveIssue}
      />
      <div className="flex items-center justify-end flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          {currentUser && !issue?.archived_at && (
            <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
          )}
          <div className="flex flex-wrap items-center gap-2.5 text-custom-text-300">
            <Tooltip tooltipContent="Copy link" isMobile={isMobile}>
              <button
                type="button"
                className="grid h-5 w-5 place-items-center rounded hover:text-custom-text-200 focus:outline-none focus:ring-2 focus:ring-custom-primary"
                onClick={handleCopyText}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </Tooltip>
            {issue?.archived_at && canRestoreIssue ? (
              <>
                <Tooltip isMobile={isMobile} tooltipContent="Restore">
                  <button
                    type="button"
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded focus:outline-none focus:ring-2 focus:ring-custom-primary",
                      {
                        "hover:text-custom-text-200": isInArchivableGroup,
                        "cursor-not-allowed text-custom-text-400": !isInArchivableGroup,
                      }
                    )}
                    onClick={handleRestore}
                    disabled={isRestoring}
                  >
                    <ArchiveRestoreIcon className="h-4 w-4" />
                  </button>
                </Tooltip>
              </>
            ) : (
              <>
                {isArchivingAllowed && (
                  <Tooltip
                    isMobile={isMobile}
                    tooltipContent={
                      isInArchivableGroup ? "Archive" : "Only completed or canceled issues can be archived"
                    }
                  >
                    <button
                      type="button"
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded focus:outline-none focus:ring-2 focus:ring-custom-primary",
                        {
                          "hover:text-custom-text-200": isInArchivableGroup,
                          "cursor-not-allowed text-custom-text-400": !isInArchivableGroup,
                        }
                      )}
                      onClick={() => {
                        if (!isInArchivableGroup) return;
                        setArchiveIssueModal(true);
                      }}
                    >
                      <ArchiveIcon className="h-4 w-4" />
                    </button>
                  </Tooltip>
                )}
              </>
            )}

            {isEditable && (
              <Tooltip tooltipContent="Delete" isMobile={isMobile}>
                <button
                  type="button"
                  className="grid h-5 w-5 place-items-center rounded hover:text-custom-text-200 focus:outline-none focus:ring-2 focus:ring-custom-primary"
                  onClick={() => setDeleteIssueModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
