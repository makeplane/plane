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
import { MoveDiagonal, MoveRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TNameDescriptionLoader } from "@plane/types";
import { EIssuesStoreType, EWorkItemConversionType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { generateWorkItemLink } from "@plane/utils";
// components
import { CopyBranchNameButton } from "@/components/work-item/copy-branch-name";
import { CopyWorkItemURLButton } from "@/components/work-item/copy-work-item-url";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { ConvertWorkItemAction } from "@/components/epics/conversions";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
// local imports
import { IssueSubscription } from "../issue-detail/subscription";
import { WorkItemDetailQuickActions } from "../issue-layouts/quick-action-dropdowns";
import { NameDescriptionUpdateStatus } from "../issue-update-status";

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

export const IssuePeekOverviewHeader = observer(function IssuePeekOverviewHeader(props: PeekOverviewHeaderProps) {
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

  const handleDeleteIssue = async () => {
    try {
      const deleteIssue = issueDetails?.archived_at ? removeArchivedIssue : removeIssue;
      await deleteIssue(workspaceSlug, projectId, issueId);
      setPeekIssue(undefined);
    } catch (_error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("entity.delete.failed", { entity: t("issue.label", { count: 1 }) }),
      });
    }
  };

  const handleArchiveIssue = async () => {
    await archiveIssue(workspaceSlug, projectId, issueId);
    // check and remove if issue is peeked
    if (getIsIssuePeeked(issueId)) {
      removeRoutePeekId();
    }
  };

  return (
    <div
      className={`relative flex items-center justify-between p-4 ${
        currentMode?.key === "full-screen" ? "border-b border-subtle" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <Tooltip tooltipContent={t("common.close_peek_view")} isMobile={isMobile}>
          <button onClick={removeRoutePeekId}>
            <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
          </button>
        </Tooltip>

        <Tooltip tooltipContent={t("issue.open_in_full_screen")} isMobile={isMobile}>
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
                <Tooltip tooltipContent={t("common.toggle_peek_view_layout")} isMobile={isMobile}>
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
        <div className="flex items-center gap-2">
          {currentUser && !isArchived && (
            <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
          )}
          <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="WORK_ITEM_CONVERSION" fallback={<></>}>
            <ConvertWorkItemAction
              workItemId={issueId}
              conversionType={EWorkItemConversionType.EPIC}
              disabled={disabled || isArchived}
            />
          </WithFeatureFlagHOC>
          {currentUser && issueDetails?.sequence_id && projectIdentifier && (
            <CopyBranchNameButton
              user={currentUser}
              projectIdentifier={projectIdentifier}
              sequenceId={issueDetails?.sequence_id}
            />
          )}
          {workspaceSlug && projectIdentifier && issueDetails?.sequence_id && (
            <CopyWorkItemURLButton
              workspaceSlug={workspaceSlug}
              projectIdentifier={projectIdentifier}
              sequenceId={issueDetails?.sequence_id}
            />
          )}
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
