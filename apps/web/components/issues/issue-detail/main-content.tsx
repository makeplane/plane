// oxlint-disable no-shadow
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { Loader } from "@plane/blocks/skeleton";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type { TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType, EIssueServiceType } from "@plane/types";
// components
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";
import { IssueTypeSwitcher } from "@/components/issues/issue-type-switcher";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useUser } from "@/hooks/store/user";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
import useSize from "@/hooks/use-window-size";
// services
import { WorkItemVersionService } from "@/services/issue";
// local imports
import { IssueDetailWidgets } from "../issue-detail-widgets";
import { NameDescriptionUpdateStatus } from "../issue-update-status";
import { PeekOverviewProperties } from "../peek-overview/properties";
import { IssueTitleInput } from "../title-input";
import { DescriptionOverflow } from "./description-overflow";
import { IssueDetailMetaRow } from "./detail-meta-row";
import { IssueActivity } from "./issue-activity";
import { IssueParentDetail } from "./parent";
import { IssueReaction } from "./reactions";
import type { TIssueOperations } from "./root";
// services init
const workItemVersionService = new WorkItemVersionService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isArchived: boolean;
};

export const IssueMainContent = observer(function IssueMainContent(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable, isArchived } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // states
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("saved");
  const [descriptionRetryState, setDescriptionRetryState] = useState<"idle" | "retrying" | "retried">("idle");
  // hooks
  const { t } = useTranslation();
  const windowSize = useSize();
  const { data: currentUser } = useUser();
  const { getUserDetails } = useMember();
  const {
    issue: { getIssueById, getIsFetchingIssueDetails },
    peekIssue,
  } = useIssueDetail();
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");
  // derived values
  const issue = issueId ? getIssueById(issueId) : undefined;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      timer = setTimeout(() => setIsSubmitting("saved"), 2000);
    } else if (isSubmitting === "submitting") setShowAlert(true);
    return () => clearTimeout(timer);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  if (!issue || !issue.project_id) return <></>;

  const isPeekModeActive = Boolean(peekIssue);

  // `description_html` only arrives with the work item details, so its absence means they are still
  // loading or failed to load. The editor reads `initialValue` once, so it mounts only once it's here.
  // The store keeps its fetching flag after a failed fetch, so it is trusted only until a retry.
  const isDescriptionLoading =
    descriptionRetryState === "retrying" || (descriptionRetryState === "idle" && getIsFetchingIssueDetails(issueId));
  const descriptionState: "loading" | "error" | "loaded" =
    issue.description_html !== undefined ? "loaded" : isDescriptionLoading ? "loading" : "error";

  const handleDescriptionRetry = async () => {
    setDescriptionRetryState("retrying");
    try {
      await issueOperations.fetch(workspaceSlug, projectId, issueId);
    } finally {
      setDescriptionRetryState("retried");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 pb-6">
        <div className="flex flex-col gap-5">
          <div className="flex h-6 items-center justify-between gap-4">
            <div className="flex min-h-6 min-w-0 flex-1 items-center gap-1.5 text-body-xs-medium">
              {issue.parent_id && (
                <>
                  <IssueParentDetail
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issueId}
                    issue={issue}
                    issueOperations={issueOperations}
                  />
                  <span className="text-tertiary" aria-hidden>
                    /
                  </span>
                </>
              )}
              <IssueTypeSwitcher issueId={issueId} disabled={isArchived || !isEditable} />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
            </div>
          </div>

          <IssueTitleInput
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            issueId={issue.id}
            isSubmitting={isSubmitting}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            issueOperations={issueOperations}
            disabled={isArchived || !isEditable}
            value={issue.name}
            containerClassName="-ml-3 [&_textarea]:block [&_textarea]:px-3 [&_textarea]:text-h3-semibold"
            readOnlyClassName="text-h3-semibold"
          />
        </div>

        <IssueDetailMetaRow
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueOperations={issueOperations}
          disabled={isArchived || !isEditable}
        />

        {descriptionState === "loading" ? (
          <Loader className="space-y-2">
            <Loader.Item width="100%" height="14px" />
            <Loader.Item width="50%" height="14px" />
          </Loader>
        ) : descriptionState === "error" ? (
          <div className="flex items-center gap-2 py-2 text-body-xs-regular text-tertiary">
            <span>{t("issue.description_load_failed")}</span>
            <Button
              variant="ghost"
              size="sm"
              stretch="auto"
              label={t("common.retry")}
              onClick={() => void handleDescriptionRetry()}
            />
          </div>
        ) : (
          <DescriptionOverflow>
            <DescriptionInput
              issueSequenceId={issue.sequence_id}
              containerClassName="-ml-6 border-none p-0! pl-6!"
              disabled={isArchived || !isEditable}
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
          </DescriptionOverflow>
        )}

        <div className="flex items-center justify-between gap-2">
          {currentUser && (
            <IssueReaction
              className="mt-0 shrink-0"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              currentUser={currentUser}
              disabled={isArchived}
            />
          )}
          {isEditable && (
            <DescriptionVersionsRoot
              className="shrink-0"
              entityInformation={{
                createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
                createdByDisplayName: getUserDetails(issue.created_by ?? "")?.display_name ?? "",
                id: issueId,
                isRestoreDisabled: !isEditable || isArchived,
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
          )}
        </div>
      </div>

      <IssueDetailWidgets
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={!isEditable || isArchived}
        renderWidgetModals={!isPeekModeActive}
        issueServiceType={EIssueServiceType.ISSUES}
      />

      {windowSize[0] < 768 && (
        <PeekOverviewProperties
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueOperations={issueOperations}
          disabled={!isEditable || isArchived}
        />
      )}

      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={isArchived} />
    </>
  );
});
