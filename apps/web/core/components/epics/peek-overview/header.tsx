/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { MoveDiagonal, MoveRight, Sidebar } from "lucide-react";
import { CopyLinkIcon, CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon } from "@plane/propel/icons";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType, EUserProjectRoles, EWorkItemConversionType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { cn, copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
import { IssueSubscription } from "@/components/issues/issue-detail/subscription";
import { IssueVotes } from "@/components/issues/issue-detail/issue-votes";
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { ConvertWorkItemAction } from "../conversions";
import { ProjectEpicQuickActions } from "../quick-actions/epic-quick-action";
import { WorkItemApproveRejectActions } from "@/components/issues/issue-detail/approve-reject-actions";

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
  toggleVotingMembersEpicModal: (value: boolean) => void;
  toggleDeleteEpicModal: (value: boolean) => void;
  toggleArchiveEpicModal: (value: boolean) => void;
  toggleDuplicateEpicModal: (value: boolean) => void;
  handleRestoreIssue: () => Promise<void>;
  isSubmitting: "submitting" | "submitted" | "saved";
};

export const EpicPeekOverviewHeader = observer(function EpicPeekOverviewHeader(props: PeekOverviewHeaderProps) {
  const {
    peekMode,
    setPeekMode,
    workspaceSlug,
    projectId,
    issueId,
    isArchived,
    toggleEditEpicModal,
    toggleVotingMembersEpicModal,
    toggleDeleteEpicModal,
    toggleArchiveEpicModal,
    toggleDuplicateEpicModal,
    embedIssue = false,
    removeRoutePeekId,
    handleRestoreIssue,
    isSubmitting,
  } = props;
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById, archiveIssue },
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
  });

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(workItemLink)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Link Copied!",
          message: "Epic link copied to clipboard.",
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to copy link",
        });
      });
  };

  const handleDelete = async () => {
    if (issue) {
      await removeIssue(issue.project_id, issue.id).then(() => {
        // TODO: add toast
        setPeekIssue(undefined);
        return;
      });
    }
  };

  const handleArchiveIssue = async () => {
    await archiveIssue(workspaceSlug, projectId, issueId);
    // check and remove if issue is peeked
    removeRoutePeekId();
  };

  const handleUpdate = async (data: Partial<TIssue>) => {
    if (issue && updateIssue) {
      // TODO: add toast
      await updateIssue(issue.project_id, issue.id, data);
    }
  };

  const isEditingAllowed = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  return (
    <div className={`relative flex items-center justify-between p-4 border-b border-subtle-1 `}>
      <div className="flex items-center gap-4">
        <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
          <button onClick={removeRoutePeekId}>
            <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent="Open work item in full screen" isMobile={isMobile}>
          <Link href={workItemLink} onClick={() => removeRoutePeekId()}>
            <MoveDiagonal className="h-4 w-4 text-tertiary hover:text-secondary" />
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
                    <currentMode.icon className="h-4 w-4 text-tertiary hover:text-secondary" />
                  </button>
                </Tooltip>
              }
            >
              {PEEK_OPTIONS.map((mode) => (
                <CustomSelect.Option key={mode.key} value={mode.key}>
                  <div
                    className={`flex items-center gap-1.5 ${
                      currentMode.key === mode.key ? "text-secondary" : "text-placeholder hover:text-secondary"
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
        {issue?.state_id && (
          <WorkItemApproveRejectActions
            projectId={projectId}
            workItemId={issueId}
            typeId={issue.type_id}
            currentStateId={issue.state_id}
            workspaceSlug={workspaceSlug}
          />
        )}
        {currentUser && (
          <IssueVotes
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            currentUser={currentUser}
            disabled={isArchived}
            toggleVotingMembersModal={toggleVotingMembersEpicModal}
          />
        )}
        {!isArchived && (
          <IssueSubscription
            serviceType={EIssueServiceType.EPICS}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
          />
        )}
        <div className="flex items-center gap-4">
          <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="WORK_ITEM_CONVERSION" fallback={<></>}>
            <ConvertWorkItemAction
              workItemId={issueId}
              conversionType={EWorkItemConversionType.WORK_ITEM}
              disabled={!isEditingAllowed || isArchived}
            />
          </WithFeatureFlagHOC>
          <Tooltip tooltipContent="Copy link" isMobile={isMobile}>
            <IconButton variant="secondary" size="lg" onClick={handleCopyText} icon={CopyLinkIcon} />
          </Tooltip>
          {issue && (
            <div ref={parentRef} className="flex items-center gap-2">
              <ProjectEpicQuickActions
                parentRef={parentRef}
                issue={issue}
                handleDelete={handleDelete}
                handleArchive={handleArchiveIssue}
                handleRestore={handleRestoreIssue}
                handleUpdate={handleUpdate}
                readOnly={!isEditingAllowed}
                toggleEditEpicModal={toggleEditEpicModal}
                toggleDeleteEpicModal={toggleDeleteEpicModal}
                toggleArchiveEpicModal={toggleArchiveEpicModal}
                toggleDuplicateEpicModal={toggleDuplicateEpicModal}
                isPeekMode
              />
              <Sidebar
                className={cn("size-4 cursor-pointer", {
                  "text-accent-primary": !epicDetailSidebarCollapsed,
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
