"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { ArchiveRestoreIcon, Link2, MoveDiagonal, MoveRight, Trash2 } from "lucide-react";
// plane imports
import { ARCHIVABLE_STATE_GROUPS } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import { TNameDescriptionLoader } from "@plane/types";
// ui
import {
  ArchiveIcon,
  CenterPanelIcon,
  CustomSelect,
  FullScreenPanelIcon,
  SidePanelIcon,
  TOAST_TYPE,
  Tooltip,
  setToast,
} from "@plane/ui";
// components
import { IssueSubscription, NameDescriptionUpdateStatus } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { generateWorkItemLink } from "@/helpers/issue.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// store hooks
import { useIssueDetail, useProject, useProjectState, useUser } from "@/hooks/store";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
export type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; i18n_title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    i18n_title: "common.side_peek ",
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
  toggleDeleteIssueModal: (issueId: string | null) => void;
  toggleArchiveIssueModal: (issueId: string | null) => void;
  handleRestoreIssue: () => void;
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
    handleRestoreIssue,
    isSubmitting,
  } = props;
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { isMobile } = usePlatformOS();
  const { getProjectIdentifierById } = useProject();
  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails = issueDetails ? getStateById(issueDetails?.state_id) : undefined;
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);
  const projectIdentifier = getProjectIdentifierById(issueDetails?.project_id);

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
    copyUrlToClipboard(workItemLink, false).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.copied_to_clipboard"),
      });
    });
  };
  // auth
  const isArchivingAllowed = !isArchived && !disabled;
  const isInArchivableGroup = !!stateDetails && ARCHIVABLE_STATE_GROUPS.includes(stateDetails?.group);
  const isRestoringAllowed = isArchived && !disabled;

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
          {isArchivingAllowed && (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={isInArchivableGroup ? t("common.actions.archive") : t("issue.archive.description")}
            >
              <button
                type="button"
                className={cn("text-custom-text-300", {
                  "hover:text-custom-text-200": isInArchivableGroup,
                  "cursor-not-allowed text-custom-text-400": !isInArchivableGroup,
                })}
                onClick={() => {
                  if (!isInArchivableGroup) return;
                  toggleArchiveIssueModal(issueId);
                }}
              >
                <ArchiveIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
          {isRestoringAllowed && (
            <Tooltip tooltipContent={t("common.actions.restore")} isMobile={isMobile}>
              <button type="button" onClick={handleRestoreIssue}>
                <ArchiveRestoreIcon className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
              </button>
            </Tooltip>
          )}
          {!disabled && (
            <Tooltip tooltipContent={t("common.actions.delete")} isMobile={isMobile}>
              <button type="button" onClick={() => toggleDeleteIssueModal(issueId)}>
                <Trash2 className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});
