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

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ContentOverflow, EntityDetailContentFooter } from "@plane/blocks/entity-detail";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { ParentPropertyIcon } from "@plane/propel/icons";
import { EFileAssetType } from "@plane/types";
import type { TNameDescriptionLoader } from "@plane/types";
import { getTextContent } from "@plane/utils";
// components
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { ParentWorkItemsListModal } from "@/components/issues/modals/add-parent/modal";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// plane web components
import { DeDupeIssuePopoverRoot } from "@/components/de-dupe/duplicate-popover";
import { IssueTypeSwitcher } from "@/components/issues/issue-detail/issue-type-switcher";
// plane web hooks
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { WorkItemVersionService } from "@/services/issue";
// local components
import { DetailMetaRow } from "../issue-detail/detail-meta-row";
import type { TIssueOperations } from "../issue-detail";
import { IssueParentDetail } from "../issue-detail/parent";
import { IssueReaction } from "../issue-detail/reactions";
import { IssueTitleInput } from "../title-input";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// services init
const workItemVersionService = new WorkItemVersionService();

type Props = {
  editorRef: RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: (value: TNameDescriptionLoader) => void;
  permissions: {
    canEditProperty: (property: TWorkItemProperty) => boolean;
    canSwitchWorkItemType: boolean;
    canReact: boolean;
    canRestoreDescriptionVersion: boolean;
  };
};

export const PeekOverviewIssueDetails = observer(function PeekOverviewIssueDetails(props: Props) {
  const { editorRef, workspaceSlug, projectId, issueId, issueOperations, permissions, isSubmitting, setIsSubmitting } =
    props;
  // hooks
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
    isParentIssueModalOpen,
    toggleParentIssueModal,
    subIssues: { fetchSubIssues },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  // states
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // reload confirmation
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      const timer = setTimeout(() => {
        setIsSubmitting("saved");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  // derived values
  const issue = issueId ? getIssueById(issueId) : undefined;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;
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

  const handleParentIssue = async (selectedIssue: { id: string; project?: { id: string } }) => {
    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, { parent_id: selectedIssue.id });
      await issueOperations.fetch(workspaceSlug, projectId, issueId, false);
      if (selectedIssue.project?.id) await fetchSubIssues(workspaceSlug, selectedIssue.project.id, selectedIssue.id);
      toggleParentIssueModal(null);
    } catch {
      console.error("Failed to update parent work item");
    }
  };

  if (!issue || !issue.project_id) return <></>;

  const issueDescription =
    issue.description_html !== undefined || issue.description_html !== null
      ? issue.description_html != ""
        ? issue.description_html
        : "<p></p>"
      : undefined;

  return (
    <div className="space-y-4">
      <ParentWorkItemsListModal
        projectId={projectId}
        workItemId={issueId}
        isOpen={isParentIssueModalOpen === issueId}
        handleClose={() => toggleParentIssueModal(null)}
        onChange={(selectedIssue) => handleParentIssue(selectedIssue)}
      />
      <div className="flex items-center justify-between gap-2 min-h-7">
        <div className="flex items-center gap-1.5 text-body-xs-medium min-h-6">
          {issue.parent_id ? (
            <IssueParentDetail
              workspaceSlug={workspaceSlug}
              projectId={issue.project_id}
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
        {duplicateIssues?.length > 0 && (
          <DeDupeIssuePopoverRoot
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            rootIssueId={issueId}
            issues={duplicateIssues}
            issueOperations={issueOperations}
          />
        )}
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

      <DetailMetaRow
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
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
            containerClassName="-ml-3 border-none"
            disabled={!permissions.canEditProperty("description_html")}
            editorRef={editorRef}
            entityId={issue.id}
            fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
            initialValue={issueDescription}
            key={issue.id}
            onSubmit={async (value, isMigrationUpdate) => {
              if (!issue.id || !issue.project_id) return;
              await issueOperations.update(workspaceSlug, issue.project_id, issue.id, {
                description_html: value.description_html,
                ...(isMigrationUpdate ? { skip_activity: "true" } : {}),
              });
            }}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            projectId={issue.project_id}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </ContentOverflow>

      <EntityDetailContentFooter
        leftElement={
          currentUser ? (
            <IssueReaction
              workspaceSlug={workspaceSlug}
              projectId={issue.project_id}
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
                  workItemVersionService.listDescriptionVersions(
                    workspaceSlug,
                    issue.project_id?.toString() ?? "",
                    issueId
                  ),
                retrieveDescriptionVersion: (issueId, versionId) =>
                  workItemVersionService.retrieveDescriptionVersion(
                    workspaceSlug,
                    issue.project_id?.toString() ?? "",
                    issueId,
                    versionId
                  ),
              }}
              handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
              projectId={issue.project_id}
              workspaceSlug={workspaceSlug}
            />
          ) : undefined
        }
      />
    </div>
  );
});
