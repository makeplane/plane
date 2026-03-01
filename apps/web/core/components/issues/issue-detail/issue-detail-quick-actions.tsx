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
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssuesStoreType, EWorkItemConversionType } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import { CopyBranchNameButton } from "@/components/work-item/copy-branch-name";
import { CopyWorkItemURLButton } from "@/components/work-item/copy-work-item-url";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { ConvertWorkItemAction } from "@/components/epics/conversions";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
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
          <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="WORK_ITEM_CONVERSION" fallback={<></>}>
            <ConvertWorkItemAction
              workItemId={issue?.id}
              conversionType={EWorkItemConversionType.EPIC}
              disabled={!!issue?.archived_at}
            />
          </WithFeatureFlagHOC>
          <div className="flex flex-wrap items-center gap-2 text-tertiary">
            {currentUser && issue?.sequence_id && projectIdentifier && (
              <CopyBranchNameButton
                user={currentUser}
                projectIdentifier={projectIdentifier}
                sequenceId={issue?.sequence_id}
              />
            )}
            {workspaceSlug && projectIdentifier && issue?.sequence_id && (
              <CopyWorkItemURLButton
                workspaceSlug={workspaceSlug}
                projectIdentifier={projectIdentifier}
                sequenceId={issue?.sequence_id}
              />
            )}
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
