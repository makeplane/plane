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

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue, TNameDescriptionLoader, IInboxIssueStore } from "@plane/types";
import { EFileAssetType, EInboxIssueSource, EInboxIssueStatus } from "@plane/types";
import { getTextContent } from "@plane/utils";
// components
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
import { DescriptionInputLoader } from "@/components/editor/rich-text/description-input/loader";
import { IssueAttachmentRoot } from "@/components/issues/attachment";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { IssueActivity } from "@/components/issues/issue-detail/issue-activity";
import { IssueReaction } from "@/components/issues/issue-detail/reactions";
import { IssueTitleInput } from "@/components/issues/title-input";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUser } from "@/hooks/store/user";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// store types
import { DeDupeIssuePopoverRoot } from "@/components/de-dupe/duplicate-popover/root";
import { IntakeAdditionalInformation } from "@/components/intake/content/additional-information";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { IntakeWorkItemVersionService } from "@/services/inbox";

// local imports
import { InboxIssueContentProperties } from "./properties";
// services init
const intakeWorkItemVersionService = new IntakeWorkItemVersionService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore;
  isEditable: boolean;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: Dispatch<SetStateAction<TNameDescriptionLoader>>;
};

export const InboxIssueMainContent = observer(function InboxIssueMainContent(props: Props) {
  const { workspaceSlug, projectId, inboxIssue, isEditable, isSubmitting, setIsSubmitting } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const { getUserDetails } = useMember();
  const { loader } = useProjectInbox();
  const { getProjectById } = useProject();
  const { removeIssue, archiveIssue } = useIssueDetail();
  // reload confirmation
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 3000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  // derived values
  const issue = inboxIssue.issue;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;
  const isIntakeAccepted = inboxIssue.status === EInboxIssueStatus.ACCEPTED;

  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    projectDetails?.workspace.toString(),
    projectId,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (_workspaceSlug: string, _projectId: string, _issueId: string) => {
        return;
      },

      remove: async (_workspaceSlug: string, _projectId: string, _issueId: string) => {
        try {
          await removeIssue(workspaceSlug, projectId, _issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Work item deleted successfully",
          });
        } catch (error) {
          console.log("Error in deleting work item:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Work item delete failed",
          });
        }
      },
      update: async (_workspaceSlug: string, _projectId: string, _issueId: string, data: Partial<TIssue>) => {
        try {
          await inboxIssue.updateIssue(data);
        } catch (error) {
          setToast({
            title: "Work item update failed",
            type: TOAST_TYPE.ERROR,
            message: "Work item update failed",
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
        } catch (error) {
          console.error("Error in archiving issue:", error);
        }
      },
    }),
    [inboxIssue]
  );

  if (!issue) return <></>;

  if (!issue?.project_id || !issue?.id) return <></>;

  return (
    <>
      <div className="space-y-4 pb-4">
        {duplicateIssues.length > 0 && (
          <DeDupeIssuePopoverRoot
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            rootIssueId={issue.id}
            issues={duplicateIssues}
            issueOperations={issueOperations}
            isIntakeIssue
          />
        )}
        <IssueTitleInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          isSubmitting={isSubmitting}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          issueOperations={issueOperations}
          disabled={!isEditable}
          value={issue.name}
          containerClassName="-ml-3"
        />

        {loader === "issue-loading" || issue.description_html === undefined ? (
          <DescriptionInputLoader />
        ) : (
          <DescriptionInput
            containerClassName="-ml-3 border-none"
            disabled={!isEditable}
            editorRef={editorRef}
            entityId={issue.id}
            fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
            initialValue={issue.description_html ?? "<p></p>"}
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
        )}

        <div className="flex items-center justify-between gap-2">
          {currentUser && (
            <IssueReaction
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issue.id}
              currentUser={currentUser}
            />
          )}
          {isEditable && (
            <DescriptionVersionsRoot
              className="flex-shrink-0"
              entityInformation={{
                createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
                createdByDisplayName:
                  inboxIssue.source === EInboxIssueSource.FORMS
                    ? "Intake Form user"
                    : (getUserDetails(issue.created_by ?? "")?.display_name ?? ""),
                id: issue.id,
                isRestoreDisabled: !isEditable,
              }}
              fetchHandlers={{
                listDescriptionVersions: (issueId) =>
                  intakeWorkItemVersionService.listDescriptionVersions(workspaceSlug, projectId, issueId),
                retrieveDescriptionVersion: (issueId, versionId) =>
                  intakeWorkItemVersionService.retrieveDescriptionVersion(workspaceSlug, projectId, issueId, versionId),
              }}
              handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>
      </div>

      <div className="py-4">
        <IssueAttachmentRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issue.id}
          disabled={!isEditable}
        />
      </div>

      <div className="py-4">
        <InboxIssueContentProperties
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issue={issue}
          issueOperations={issueOperations}
          isEditable={isEditable}
          duplicateIssueDetails={inboxIssue?.duplicate_issue_detail}
          isIntakeAccepted={isIntakeAccepted}
        />
      </div>

      {/* Additional Information */}
      {inboxIssue.issue && <IntakeAdditionalInformation workItemDetails={inboxIssue.issue} />}

      <div className="pt-4">
        <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issue.id} isIntakeIssue />
      </div>
    </>
  );
});
