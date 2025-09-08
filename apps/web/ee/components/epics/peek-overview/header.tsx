"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Link2, MoveDiagonal, MoveRight, Sidebar } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssueServiceType, EIssuesStoreType, EUserProjectRoles, EWorkItemConversionType, TIssue } from "@plane/types";
import { CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
import { cn, copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
import { IssueSubscription } from "@/components/issues/issue-detail/subscription";
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { WithFeatureFlagHOC } from "../../feature-flags";
import { ConvertWorkItemAction } from "../conversions";
import { ProjectEpicQuickActions } from "../quick-actions/epic-quick-action";

export type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    title: "Side Peek",
  },
  {
    key: "modal",
    icon: CenterPanelIcon,
    title: "Modal",
  },
  {
    key: "full-screen",
    icon: FullScreenPanelIcon,
    title: "Full Screen",
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
  toggleEditEpicModal: (value: boolean) => void;
  toggleDeleteEpicModal: (value: boolean) => void;
  toggleDuplicateEpicModal: (value: boolean) => void;
  handleRestoreIssue: () => void;
  isSubmitting: "submitting" | "submitted" | "saved";
};

export const EpicPeekOverviewHeader: FC<PeekOverviewHeaderProps> = observer((props) => {
  const {
    peekMode,
    setPeekMode,
    workspaceSlug,
    projectId,
    issueId,
    isArchived,
    toggleEditEpicModal,
    toggleDeleteEpicModal,
    toggleDuplicateEpicModal,
    disabled,
    embedIssue = false,
    removeRoutePeekId,
    isSubmitting,
  } = props;
  // router
  const router = useAppRouter();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail(EIssueServiceType.EPICS);

  const { updateIssue, removeIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  const { allowPermissions } = useUserPermissions();
  const { epicDetailSidebarCollapsed, toggleEpicDetailSidebar } = useAppTheme();
  const { getProjectIdentifierById } = useProject();

  const { isMobile } = usePlatformOS();
  // derived values
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);
  const issue = getIssueById(issueId);
  const projectIdentifier = issue?.project_id ? getProjectIdentifierById(issue?.project_id) : "";

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
    isArchived,
  });

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(workItemLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Epic link copied to clipboard.",
      });
    });
  };

  const handleDelete = async () => {
    if (issue) {
      await removeIssue(issue.project_id, issue.id).then(() => {
        // TODO: add toast
        setPeekIssue(undefined);
      });
    }
  };

  const handleUpdate = async (data: Partial<TIssue>) => {
    if (issue && updateIssue) {
      // TODO: add toast
      updateIssue(issue.project_id, issue.id, data);
    }
  };

  const isEditingAllowed = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className={`relative flex items-center justify-between p-4 border-b border-custom-border-200 `}>
      <div className="flex items-center gap-4">
        <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
          <button onClick={removeRoutePeekId}>
            <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent="Open work item in full screen" isMobile={isMobile}>
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
                <Tooltip tooltipContent="Toggle peek view layout" isMobile={isMobile}>
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
                    {mode.title}
                  </div>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
      </div>
      <div className="flex items-center gap-x-4">
        <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
        <IssueSubscription
          serviceType={EIssueServiceType.EPICS}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
        />
        <div className="flex items-center gap-4">
          <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="WORK_ITEM_CONVERSION" fallback={<></>}>
            <ConvertWorkItemAction
              workItemId={issueId}
              conversionType={EWorkItemConversionType.WORK_ITEM}
              disabled={!isEditingAllowed || isArchived}
            />
          </WithFeatureFlagHOC>
          <Tooltip tooltipContent="Copy link" isMobile={isMobile}>
            <button type="button" onClick={handleCopyText}>
              <Link2 className="h-4 w-4 -rotate-45 text-custom-text-300 hover:text-custom-text-200" />
            </button>
          </Tooltip>
          {issue && (
            <div ref={parentRef} className="flex items-center gap-2">
              <ProjectEpicQuickActions
                parentRef={parentRef}
                issue={issue}
                handleDelete={handleDelete}
                handleUpdate={handleUpdate}
                readOnly={!isEditingAllowed}
                toggleEditEpicModal={toggleEditEpicModal}
                toggleDeleteEpicModal={toggleDeleteEpicModal}
                toggleDuplicateEpicModal={toggleDuplicateEpicModal}
                isPeekMode
              />
              <Sidebar
                className={cn("size-4 cursor-pointer", {
                  "text-custom-primary-100": !epicDetailSidebarCollapsed,
                })}
                onClick={() => toggleEpicDetailSidebar(!epicDetailSidebarCollapsed)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
