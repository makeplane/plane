"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Link2, MoveDiagonal, MoveRight } from "lucide-react";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuesStoreType, TNameDescriptionLoader } from "@plane/types";
import {
  CenterPanelIcon,
  CustomSelect,
  FullScreenPanelIcon,
  SidePanelIcon,
  TOAST_TYPE,
  Tooltip,
  setToast,
} from "@plane/ui";
import { copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// components
import { IssueSubscription, NameDescriptionUpdateStatus, WorkItemDetailQuickActions } from "@/components/issues";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// helpers
// store hooks

import { useIssueDetail, useIssues, useProject, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
export type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; i18n_title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    i18n_title: "common.side_peek",
  },
  {
    key: "modal",
    icon: CenterPanelIcon,
    i18n_title: "common.modal",
  },
  {
    key: "full-screen",
    icon: FullScreenPanelIcon,
    i18n_title: "common.full_screen",
  },
];

export type PeekOverviewHeaderProps = {
  peekMode: TPeekModes;
  setPeekMode: (value: TPeekModes) => void;
  removeRoutePeekId: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isArchived: boolean;
  disabled: boolean;
  embedIssue: boolean;
  toggleDeleteIssueModal: (value: boolean) => void;
  toggleArchiveIssueModal: (value: boolean) => void;
  toggleDuplicateIssueModal: (value: boolean) => void;
  toggleEditIssueModal: (value: boolean) => void;
  handleRestoreIssue: () => Promise<void>;
  isSubmitting: TNameDescriptionLoader;
};

export const IssuePeekOverviewHeader: FC<PeekOverviewHeaderProps> = observer((props) => {
  const {
    peekMode,
    setPeekMode,
    workspaceSlug,
    projectId,
    issueId,
    isArchived,
    disabled,
    embedIssue = false,
    removeRoutePeekId,
    toggleDeleteIssueModal,
    toggleArchiveIssueModal,
    toggleDuplicateIssueModal,
    toggleEditIssueModal,
    handleRestoreIssue,
    isSubmitting,
  } = props;
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
    setPeekIssue,
    removeIssue,
    archiveIssue,
    getIsIssuePeeked,
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const issueDetails = getIssueById(issueId);
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);
  const projectIdentifier = getProjectIdentifierById(issueDetails?.project_id);
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issueDetails?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issueDetails?.sequence_id,
    isArchived,
  });

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(workItemLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.link_copied_to_clipboard"),
      });
    });
  };

  const handleDeleteIssue = async () => {
    try {
      const deleteIssue = issueDetails?.archived_at ? removeArchivedIssue : removeIssue;

      return deleteIssue(workspaceSlug, projectId, issueId).then(() => {
        setPeekIssue(undefined);
        captureSuccess({
          eventName: WORK_ITEM_TRACKER_EVENTS.delete,
          payload: { id: issueId },
        });
      });
    } catch (error) {
      setToast({
        title: t("toast.error"),
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
      // check and remove if issue is peeked
      if (getIsIssuePeeked(issueId)) {
        removeRoutePeekId();
      }
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

  return (
    <div
      className={`relative flex items-center justify-between p-4 ${
        currentMode?.key === "full-screen" ? "border-b border-custom-border-200" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <Tooltip tooltipContent={t("common.close_peek_view")} isMobile={isMobile}>
          <button onClick={removeRoutePeekId}>
            <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent={t("issue.open_in_full_screen")} isMobile={isMobile}>
          <Link href={workItemLink} onClick={() => removeRoutePeekId()}>
            <MoveDiagonal className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
          </Link>
        </Tooltip>
        {currentMode && embedIssue === false && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <CustomSelect
              value={currentMode}
              onChange={(val: any) => setPeekMode(val)}
              customButton={
                <Tooltip tooltipContent={t("common.toggle_peek_view_layout")} isMobile={isMobile}>
                  <button type="button" className="">
                    <currentMode.icon className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
                  </button>
                </Tooltip>
              }
            >
              {PEEK_OPTIONS.map((mode) => (
                <CustomSelect.Option key={mode.key} value={mode.key}>
                  <div
                    className={`flex items-center gap-1.5 ${
                      currentMode.key === mode.key
                        ? "text-custom-text-200"
                        : "text-custom-text-400 hover:text-custom-text-200"
                    }`}
                  >
                    <mode.icon className="-my-1 h-4 w-4 flex-shrink-0" />
                    {t(mode.i18n_title)}
                  </div>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
      </div>
      <div className="flex items-center gap-x-4">
        <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
        <div className="flex items-center gap-4">
          {currentUser && !isArchived && (
            <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
          )}
          <Tooltip tooltipContent={t("common.actions.copy_link")} isMobile={isMobile}>
            <button type="button" onClick={handleCopyText}>
              <Link2 className="h-4 w-4 -rotate-45 text-custom-text-300 hover:text-custom-text-200" />
            </button>
          </Tooltip>
          {issueDetails && (
            <WorkItemDetailQuickActions
              parentRef={parentRef}
              issue={issueDetails}
              handleDelete={handleDeleteIssue}
              handleArchive={handleArchiveIssue}
              handleRestore={handleRestoreIssue}
              readOnly={disabled}
              toggleDeleteIssueModal={toggleDeleteIssueModal}
              toggleArchiveIssueModal={toggleArchiveIssueModal}
              toggleDuplicateIssueModal={toggleDuplicateIssueModal}
              toggleEditIssueModal={toggleEditIssueModal}
              isPeekMode
            />
          )}
        </div>
      </div>
    </div>
  );
});
