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

import type { FC } from "react";
import React, { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TIssue, TSubIssueOperations } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// components
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
import { SubIssuesListRoot } from "@/components/issues/issue-detail-widgets/sub-issues/issues-list/root";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { useEpicAnalytics } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const EpicIssuesOverviewRoot = observer(function EpicIssuesOverviewRoot(props: Props) {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // state
  const [issueCrudState, setIssueCrudState] = useState<{
    create: TIssueCrudState;
    existing: TIssueCrudState;
    update: TIssueCrudState;
    delete: TIssueCrudState;
  }>({
    create: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    existing: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    update: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    delete: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
  });
  // params
  const { initiativeId } = useParams();
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId, loader: subIssuesLoader },
    peekIssue: epicPeekIssue,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { toggleCreateIssueModal, toggleDeleteIssueModal } = useIssueDetail(EIssueServiceType.EPICS);
  const { fetchEpicAnalytics } = useEpicAnalytics();
  const {
    initiative: { fetchInitiativeAnalytics },
  } = useInitiatives();
  const { t } = useTranslation();

  // helpers
  const subIssueOperations = useSubIssueOperations(EIssueServiceType.EPICS);

  // handler
  const handleIssueCrudState = (
    key: "create" | "existing" | "update" | "delete",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudState({
      ...issueCrudState,
      [key]: {
        toggle: !issueCrudState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  const handleFetchSubIssues = useCallback(async () => {
    await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, epicId);
  }, [epicId, projectId, subIssueOperations, workspaceSlug]);

  const handleDeleteSubIssue = async () => {
    await subIssueOperations
      .deleteSubIssue(
        workspaceSlug,
        projectId,
        issueCrudState?.delete?.parentIssueId as string,
        issueCrudState?.delete?.issue?.id as string
      )
      .then(() => {
        fetchEpicAnalytics(workspaceSlug, projectId, epicId);
      });
  };

  const handleUpdateSubIssue = async (_issue: TIssue) => {
    await subIssueOperations
      .updateSubIssue(workspaceSlug, projectId, epicId, _issue.id, _issue, issueCrudState?.update?.issue, true)
      .then(() => {
        fetchEpicAnalytics(workspaceSlug, projectId, epicId);
      });
  };

  useEffect(() => {
    handleFetchSubIssues();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epicId]);

  // render conditions
  const shouldRenderDeleteIssueModal =
    issueCrudState?.delete?.toggle &&
    issueCrudState?.delete?.issue &&
    issueCrudState.delete.parentIssueId &&
    issueCrudState.delete.issue.id;

  // derived values
  const issue = getIssueById(epicId);
  const shouldRenderUpdateIssueModal = issueCrudState?.update?.toggle && issueCrudState?.update?.issue;
  const subIssueIds = subIssuesByIssueId(epicId) ?? [];
  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0 || subIssueIds.length > 0;
  const showEmptyState = !hasSubIssues && subIssuesLoader !== "init-loader";
  const fetchInitiativeAnalyticsIfNeeded = async () => {
    if (initiativeId && epicPeekIssue?.issueId) {
      await fetchInitiativeAnalytics(workspaceSlug, initiativeId?.toString());
    }
  };

  const epicSubIssuesOperation: TSubIssueOperations = {
    ...subIssueOperations,
    addSubIssue: async (workspaceSlug, projectId, parentIssueId, issue) => {
      await subIssueOperations.addSubIssue(workspaceSlug, projectId, parentIssueId, issue);
      await fetchEpicAnalytics(workspaceSlug, projectId, epicId);
      await fetchInitiativeAnalyticsIfNeeded();
    },
    updateSubIssue: async (workspaceSlug, projectId, parentIssueId, issueId, issue, prevIssue) => {
      await subIssueOperations.updateSubIssue(workspaceSlug, projectId, parentIssueId, issueId, issue, prevIssue);
      await fetchEpicAnalytics(workspaceSlug, projectId, epicId);
      await fetchInitiativeAnalyticsIfNeeded();
    },
    deleteSubIssue: async (workspaceSlug, projectId, parentIssueId, issueId) => {
      await subIssueOperations.deleteSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
      await fetchEpicAnalytics(workspaceSlug, projectId, epicId);
      await fetchInitiativeAnalyticsIfNeeded();
    },
  };

  if (showEmptyState) {
    return (
      <EmptyStateCompact
        assetKey="work-item"
        title={t("project_empty_state.epic_work_items.title")}
        description={t("project_empty_state.epic_work_items.description")}
        rootClassName="py-20"
      />
    );
  }

  return (
    <>
      <SubIssuesListRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={epicId}
        rootIssueId={epicId}
        spacingLeft={6}
        canEdit={!disabled}
        handleIssueCrudState={handleIssueCrudState}
        subIssueOperations={epicSubIssuesOperation}
        issueServiceType={EIssueServiceType.EPICS}
        storeType={EIssuesStoreType.EPIC}
      />

      {shouldRenderDeleteIssueModal && (
        <DeleteIssueModal
          isOpen={issueCrudState?.delete?.toggle}
          handleClose={() => {
            handleIssueCrudState("delete", null, null);
            toggleDeleteIssueModal(null);
          }}
          data={issueCrudState?.delete?.issue as TIssue}
          onSubmit={handleDeleteSubIssue}
          isSubIssue
        />
      )}

      {shouldRenderUpdateIssueModal && (
        <CreateUpdateIssueModal
          isOpen={issueCrudState?.update?.toggle}
          onClose={() => {
            handleIssueCrudState("update", null, null);
            toggleCreateIssueModal(false);
          }}
          data={issueCrudState?.update?.issue ?? undefined}
          onSubmit={async (_issue: TIssue) => handleUpdateSubIssue(_issue)}
        />
      )}
    </>
  );
});
