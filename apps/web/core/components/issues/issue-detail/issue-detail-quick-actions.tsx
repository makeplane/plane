import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CopyLinkIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
import { generateWorkItemLink, copyTextToClipboard } from "@plane/utils";
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

export const IssueDetailQuickActions = observer(function IssueDetailQuickActions(props: Props) {
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
  const handleCopyText = async () => {
    try {
      const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
      await copyTextToClipboard(`${originURL}${workItemLink}`);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.copied_to_clipboard"),
      });
    } catch (_error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
      });
    }
  };

  const handleDeleteIssue = async () => {
    try {
      const deleteIssue = issue?.archived_at ? removeArchivedIssue : removeIssue;
      const redirectionPath = issue?.archived_at
        ? `/${workspaceSlug}/projects/${projectId}/archives/issues`
        : `/${workspaceSlug}/projects/${projectId}/issues`;

      await deleteIssue(workspaceSlug, projectId, issueId);
      router.push(redirectionPath);
    } catch (_error) {
      setToast({
        title: t("toast.error "),
        type: TOAST_TYPE.ERROR,
        message: t("entity.delete.failed", { entity: t("issue.label", { count: 1 }) }),
      });
    }
  };

  const handleArchiveIssue = async () => {
    try {
      await archiveIssue(workspaceSlug, projectId, issueId);
      router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
    } catch (_error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("issue.archive.failed.message"),
      });
    }
  };

  const handleRestore = async () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    try {
      await restoreIssue(workspaceSlug.toString(), projectId.toString(), issueId.toString());
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("issue.restore.success.title"),
        message: t("issue.restore.success.message"),
      });
      router.push(workItemLink);
    } catch (_error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("issue.restore.failed.message"),
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-end flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {currentUser && !issue?.archived_at && (
            <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
          )}
          <div className="flex flex-wrap items-center gap-2 text-tertiary">
            <Tooltip tooltipContent={t("common.actions.copy_link")} isMobile={isMobile}>
              <IconButton variant="secondary" size="lg" onClick={handleCopyText} icon={CopyLinkIcon} />
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
