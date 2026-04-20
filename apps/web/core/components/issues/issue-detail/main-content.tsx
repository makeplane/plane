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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ContentOverflow, EntityDetailContentFooter } from "@plane/blocks/entity-detail";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { ParentPropertyIcon } from "@plane/propel/icons";
import type { TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType, EIssueServiceType } from "@plane/types";
import { getTextContent } from "@plane/utils";
// components
import { ParentWorkItemsListModal } from "@/components/issues/modals/add-parent/modal";
// components
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
import useSize from "@/hooks/use-window-size";
// plane web components
import { DeDupeIssuePopoverRoot } from "@/components/de-dupe/duplicate-popover";
import { IssueTypeSwitcher } from "@/components/issues/issue-detail/issue-type-switcher";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { WorkItemVersionService } from "@/services/issue";
// local imports
import { IssueDetailWidgets } from "../issue-detail-widgets";
import { NameDescriptionUpdateStatus } from "../issue-update-status";
import { PeekOverviewProperties } from "../peek-overview/properties";
import { IssueTitleInput } from "../title-input";
import { DetailMetaRow } from "./detail-meta-row";
import { IssueActivity } from "./issue-activity";
import { IssueParentDetail } from "./parent";
import { IssueReaction } from "./reactions";
import type { TIssueOperations } from "./root";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// services init
const workItemVersionService = new WorkItemVersionService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  permissions: {
    canEdit: boolean;
    canEditProperty: (property: TWorkItemProperty) => boolean;
    canSwitchWorkItemType: boolean;
    canRestoreDescriptionVersion: boolean;
    canReact: boolean;
    canAddDependencies: boolean;
    canAddRelations: boolean;
    canAddLinks: boolean;
    canAddAttachments: boolean;
    canAddPages: boolean;
    canAddCustomerRequests: boolean;
    canAddWorklog: boolean;
    comments: {
      canCreate: boolean;
      canEdit: (commentId: string) => boolean;
      canDelete: (commentId: string) => boolean;
      canReact: (commentId: string) => boolean;
    };
    sub_work_items: {
      getCanView: (projectId: string, workItemId: string) => boolean;
      getCanEdit: (projectId: string, workItemId: string) => boolean;
      getCanEditProperty: (projectId: string, workItemId: string, property: TWorkItemProperty) => boolean;
      getCanDelete: (projectId: string, workItemId: string) => boolean;
      getCanAdd: (parentWorkItemProjectId: string, parentWorkItemId: string) => boolean;
      getCanRemove: (
        parentWorkItemProjectId: string,
        parentWorkItemId: string,
        projectId: string,
        workItemId: string
      ) => boolean;
    };
  };
};

export const IssueMainContent = observer(function IssueMainContent(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, permissions } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // states
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // hooks
  const { t } = useTranslation();
  const windowSize = useSize();
  const { data: currentUser } = useUser();
  const { getUserDetails } = useMember();
  const {
    issue: { getIssueById },
    peekIssue,
    isParentIssueModalOpen,
    toggleParentIssueModal,
    subIssues: { fetchSubIssues },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");
  // derived values
  const projectDetails = getProjectById(projectId);
  const issue = issueId ? getIssueById(issueId) : undefined;
  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    projectDetails?.workspace.toString(),
    projectDetails?.id,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      const timer = setTimeout(() => setIsSubmitting("saved"), 2000);
      return () => clearTimeout(timer);
    } else if (isSubmitting === "submitting") setShowAlert(true);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  const handleParentIssue = async (selectedIssue: { id: string; project?: { id: string } }) => {
    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, {
        parent_id: selectedIssue.id,
      });
      await issueOperations.fetch(workspaceSlug, projectId, issueId, false);
      if (selectedIssue.project?.id) await fetchSubIssues(workspaceSlug, selectedIssue.project.id, selectedIssue.id);
      toggleParentIssueModal(null);
    } catch {
      console.error("Failed to update parent work item");
    }
  };

  if (!issue || !issue.project_id) return <></>;

  const isPeekModeActive = Boolean(peekIssue);

  return (
    <>
      <ParentWorkItemsListModal
        projectId={projectId}
        workItemId={issueId}
        isOpen={isParentIssueModalOpen === issueId}
        handleClose={() => toggleParentIssueModal(null)}
        onChange={(selectedIssue) => handleParentIssue(selectedIssue)}
      />
      <div className="flex flex-col gap-4 pb-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 h-6">
            <div className="flex items-center gap-1.5 text-body-xs-medium min-h-6">
              {issue.parent_id ? (
                <IssueParentDetail
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issue={issue}
                  issueOperations={issueOperations}
                />
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-body-xs-medium text-secondary hover:text-primary cursor-pointer"
                  onClick={() => permissions.canEditProperty("parent_id") && toggleParentIssueModal(issueId)}
                  disabled={!permissions.canEditProperty("parent_id")}
                >
                  <ParentPropertyIcon className="size-3.5" />
                  {t("issue.add.parent")}
                </button>
              )}
              <span className="text-tertiary">/</span>
              <IssueTypeSwitcher issueId={issueId} canSwitchWorkItemType={permissions.canSwitchWorkItemType} />
            </div>
            <div className="flex items-center gap-3">
              <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
              {duplicateIssues?.length > 0 && (
                <DeDupeIssuePopoverRoot
                  workspaceSlug={workspaceSlug}
                  projectId={issue.project_id}
                  rootIssueId={issueId}
                  issues={duplicateIssues}
                  issueOperations={issueOperations}
                  renderDeDupeActionModals={!isPeekModeActive}
                />
              )}
            </div>
          </div>

          <IssueTitleInput
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            issueId={issue.id}
            isSubmitting={isSubmitting}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            issueOperations={issueOperations}
            disabled={!permissions.canEditProperty("name")}
            value={issue.name}
            containerClassName="-ml-3"
          />
        </div>

        <DetailMetaRow
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueOperations={issueOperations}
          permissions={permissions}
        />

        <ContentOverflow
          maxHeight={140}
          buttonClassName="text-left"
          showMoreLabel={t("show_all")}
          showLessLabel={t("show_less")}
          forceExpanded={isDescriptionExpanded}
          onCollapse={() => setIsDescriptionExpanded(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div onFocus={() => setIsDescriptionExpanded(true)}>
            <DescriptionInput
              issueSequenceId={issue.sequence_id}
              containerClassName="-ml-6 border-none p-0! pl-6!"
              disabled={!permissions.canEditProperty("description_html")}
              editorRef={editorRef}
              entityId={issue.id}
              fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
              initialValue={issue.description_html}
              key={issue.id}
              onSubmit={async (value, isMigrationUpdate) => {
                if (!issue.id || !issue.project_id) return;
                await issueOperations.update(workspaceSlug, issue.project_id, issue.id, {
                  description_html: value.description_html,
                  ...(isMigrationUpdate ? { skip_activity: "true" } : {}),
                });
              }}
              projectId={issue.project_id}
              setIsSubmitting={(value) => setIsSubmitting(value)}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </ContentOverflow>

        <EntityDetailContentFooter
          leftElement={
            currentUser ? (
              <IssueReaction
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                currentUser={currentUser}
                disabled={!permissions.canReact}
                className="mt-0 shrink-0"
              />
            ) : undefined
          }
          rightElement={
            permissions.canRestoreDescriptionVersion ? (
              <DescriptionVersionsRoot
                className="shrink-0"
                entityInformation={{
                  createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
                  createdByDisplayName: getUserDetails(issue.created_by ?? "")?.display_name ?? "",
                  id: issueId,
                  isRestoreDisabled: !permissions.canRestoreDescriptionVersion,
                }}
                fetchHandlers={{
                  listDescriptionVersions: (issueId) =>
                    workItemVersionService.listDescriptionVersions(workspaceSlug, projectId, issueId),
                  retrieveDescriptionVersion: (issueId, versionId) =>
                    workItemVersionService.retrieveDescriptionVersion(workspaceSlug, projectId, issueId, versionId),
                }}
                handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
              />
            ) : undefined
          }
        />
      </div>

      <IssueDetailWidgets
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        permissions={permissions}
        renderWidgetModals={!isPeekModeActive}
        issueServiceType={EIssueServiceType.ISSUES}
      />

      {windowSize[0] < 768 && (
        <PeekOverviewProperties
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueOperations={issueOperations}
          permissions={permissions}
        />
      )}

      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} permissions={permissions} />
    </>
  );
});
