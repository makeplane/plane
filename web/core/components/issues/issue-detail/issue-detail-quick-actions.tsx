"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { ArchiveIcon, ArchiveRestoreIcon, LinkIcon, Trash2 } from "lucide-react";
import {
  ISSUE_ARCHIVED,
  ISSUE_DELETED,
  ARCHIVABLE_STATE_GROUPS,
  EIssuesStoreType,
  EUserPermissions,
  EUserPermissionsLevel,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { ArchiveIssueModal, DeleteIssueModal, IssueSubscription } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { generateWorkItemLink } from "@/helpers/issue.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import {
  useEventTracker,
  useIssueDetail,
  useIssues,
  useProject,
  useProjectState,
  useUser,
  useUserPermissions,
} from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const IssueDetailQuickActions: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
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
  const { getProjectIdentifierById } = useProject();
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
  const projectIdentifier = getProjectIdentifierById(projectId);

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug,
    projectId,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  // handlers
  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}${workItemLink}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.copied_to_clipboard"),
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
          payload: { id: issueId, state: "SUCCESS", element: "Work item detail page" },
          path: pathname,
        });
      });
    } catch (error) {
      setToast({
        title: t("toast.error "),
        type: TOAST_TYPE.ERROR,
        message: t("entity.delete.failed", { entity: t("issue.label", { count: 1 }) }),
      });
      captureIssueEvent({
        eventName: ISSUE_DELETED,
        payload: { id: issueId, state: "FAILED", element: "Work item detail page" },
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
          title: t("issue.restore.success.title"),
          message: t("issue.restore.success.message"),
        });
        router.push(workItemLink);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("issue.restore.failed.message"),
        });
      })
      .finally(() => setIsRestoring(false));
  };

  // auth
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const canRestoreIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
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
            <Tooltip tooltipContent={t("common.actions.copy_link")} isMobile={isMobile}>
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
                    tooltipContent={isInArchivableGroup ? t("common.actions.archive") : t("issue.archive.description")}
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
              <Tooltip tooltipContent={t("common.actions.delete")} isMobile={isMobile}>
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
