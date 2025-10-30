"use client";

import type { FC } from "react";
import React, { useRef } from "react";
import { observer } from "mobx-react";
import { LinkIcon } from "lucide-react";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
import { generateWorkItemLink, copyTextToClipboard } from "@plane/utils";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { WorkItemDetailQuickActions } from "../issue-layouts/quick-action-dropdowns";
import { IssueSubscription } from "./subscription";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const IssueDetailQuickActions: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();

  // ref
  const parentRef = useRef<HTMLDivElement>(null);

  // router
  const router = useAppRouter();

  // hooks
  const { data: currentUser } = useUser();
  const { isMobile } = usePlatformOS();
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

  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;

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
        captureSuccess({
          eventName: WORK_ITEM_TRACKER_EVENTS.delete,
          payload: { id: issueId },
        });
      });
    } catch (error) {
      setToast({
        title: t("toast.error "),
        type: TOAST_TYPE.ERROR,
        message: t("entity.delete.failed", { entity: t("issue.label", { count: 1 }) }),
      });
      captureError({
        eventName: WORK_ITEM_TRACKER_EVENTS.delete,
        payload: { id: issueId },
        error: error as Error,
      });
    }
  };

  const handleArchiveIssue = async () => {
    try {
      await archiveIssue(workspaceSlug, projectId, issueId);
      router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
      captureSuccess({
        eventName: WORK_ITEM_TRACKER_EVENTS.archive,
        payload: { id: issueId },
      });
    } catch (error) {
      captureError({
        eventName: WORK_ITEM_TRACKER_EVENTS.archive,
        payload: { id: issueId },
        error: error as Error,
      });
    }
  };

  const handleRestore = async () => {
    if (!workspaceSlug || !projectId || !issueId) return;

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
      });
  };

  return (
    <>
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
            <WorkItemDetailQuickActions
              parentRef={parentRef}
              issue={issue}
              handleDelete={handleDeleteIssue}
              handleArchive={handleArchiveIssue}
              handleRestore={handleRestore}
            />
          </div>
        </div>
      </div>
    </>
  );
});
