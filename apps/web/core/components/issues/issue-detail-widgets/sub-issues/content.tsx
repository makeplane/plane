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

import { useEffect, useState, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
// components
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { CreateUpdateIssueModal } from "../../issue-modal/root";
import { useSubIssueOperations } from "./helper";
import { SubIssuesListRoot } from "./issues-list/root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  permissions: {
    getCanView: (projectId: string, workItemId: string) => boolean;
    getCanEdit: (projectId: string, workItemId: string) => boolean;
    getCanEditProperty: (projectId: string, workItemId: string, property: keyof TIssue) => boolean; // TODO: <permissionEngine> update property type to TWorkItemProperty
    getCanDelete: (projectId: string, workItemId: string) => boolean;
    getCanRemove: (
      parentWorkItemProjectId: string,
      parentWorkItemId: string,
      projectId: string,
      workItemId: string
    ) => boolean;
  };
  issueServiceType?: TIssueServiceType;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const SubIssuesCollapsibleContent = observer(function SubIssuesCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, parentIssueId, permissions, issueServiceType = EIssueServiceType.ISSUES } = props;
  // ref — tracks which parentIssueId is currently being fetched to avoid
  // duplicate requests for the same id without blocking fetches for a different id
  const fetchingIdRef = useRef<string | null>(null);
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
  // store hooks
  const {
    toggleCreateIssueModal,
    toggleDeleteIssueModal,
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
  } = useIssueDetail(issueServiceType);

  // helpers
  const subIssueOperations = useSubIssueOperations(issueServiceType);
  const subIssueHelpers = subIssueHelpersByIssueId(`${parentIssueId}_root`);

  // handler
  const handleIssueCrudState = useCallback(
    (key: "create" | "existing" | "update" | "delete", _parentIssueId: string | null, issue: TIssue | null = null) => {
      setIssueCrudState({
        ...issueCrudState,
        [key]: {
          toggle: !issueCrudState[key].toggle,
          parentIssueId: _parentIssueId,
          issue,
        },
      });
    },
    [issueCrudState]
  );

  const handleFetchSubIssues = useCallback(async () => {
    const currentSubIssueHelpers = subIssueHelpersByIssueId(`${parentIssueId}_root`);
    if (fetchingIdRef.current === parentIssueId || currentSubIssueHelpers.issue_visibility.includes(parentIssueId))
      return;
    fetchingIdRef.current = parentIssueId;
    try {
      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
      await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, parentIssueId);
      // Guard: setSubIssueHelpers is a toggle, so only call if not already set
      const helpers = subIssueHelpersByIssueId(`${parentIssueId}_root`);
      if (!helpers.issue_visibility.includes(parentIssueId)) {
        setSubIssueHelpers(`${parentIssueId}_root`, "issue_visibility", parentIssueId);
      }
    } catch (error) {
      console.error("Error fetching sub-work items:", error);
    } finally {
      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
      fetchingIdRef.current = null;
    }
  }, [parentIssueId, projectId, setSubIssueHelpers, subIssueHelpersByIssueId, subIssueOperations, workspaceSlug]);

  useEffect(() => {
    handleFetchSubIssues();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [parentIssueId]);

  // render conditions
  const shouldRenderDeleteIssueModal =
    issueCrudState?.delete?.toggle &&
    issueCrudState?.delete?.issue &&
    issueCrudState.delete.parentIssueId &&
    issueCrudState.delete.issue.id;

  const shouldRenderUpdateIssueModal = issueCrudState?.update?.toggle && issueCrudState?.update?.issue;

  const subWorkItemProjectId = issueCrudState?.delete?.issue?.project_id;
  const parentWorkItemId = issueCrudState?.delete?.parentIssueId;
  const subWorkItemId = issueCrudState?.delete?.issue?.id;

  return (
    <>
      {subIssueHelpers.issue_visibility.includes(parentIssueId) && (
        <SubIssuesListRoot
          storeType={EIssuesStoreType.PROJECT}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentIssueId={parentIssueId}
          rootIssueId={parentIssueId}
          spacingLeft={6}
          permissions={permissions}
          handleIssueCrudState={handleIssueCrudState}
          subIssueOperations={subIssueOperations}
          issueServiceType={issueServiceType}
        />
      )}

      {shouldRenderDeleteIssueModal && (
        <DeleteIssueModal
          isOpen={issueCrudState?.delete?.toggle}
          handleClose={() => {
            handleIssueCrudState("delete", null, null);
            toggleDeleteIssueModal(null);
          }}
          data={issueCrudState?.delete?.issue as TIssue}
          onSubmit={async () => {
            if (subWorkItemProjectId && parentWorkItemId && subWorkItemId) {
              await subIssueOperations.deleteSubIssue(
                workspaceSlug,
                subWorkItemProjectId,
                parentWorkItemId,
                subWorkItemId
              );
            }
          }}
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
          onSubmit={async (_issue: TIssue) => {
            if (subWorkItemProjectId) {
              await subIssueOperations.updateSubIssue(
                workspaceSlug,
                subWorkItemProjectId,
                parentIssueId,
                _issue.id,
                _issue,
                issueCrudState?.update?.issue,
                true
              );
            }
          }}
        />
      )}
    </>
  );
});
