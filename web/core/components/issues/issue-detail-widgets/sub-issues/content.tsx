"use client";
import React, { FC, useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { TIssue } from "@plane/types";
// components
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
import { IssueList } from "@/components/issues/sub-issues/issues-list";
// hooks
import { useIssueDetail } from "@/hooks/store";
// helper
import { useSubIssueOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  disabled: boolean;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const SubIssuesCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, parentIssueId, disabled } = props;
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
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
    toggleCreateIssueModal,
    toggleDeleteIssueModal,
  } = useIssueDetail();

  // helpers
  const subIssueOperations = useSubIssueOperations();
  const subIssueHelpers = subIssueHelpersByIssueId(`${parentIssueId}_root`);

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
    if (!subIssueHelpers.issue_visibility.includes(parentIssueId)) {
      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
      await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, parentIssueId);
      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
    }
    setSubIssueHelpers(`${parentIssueId}_root`, "issue_visibility", parentIssueId);
  }, [
    parentIssueId,
    projectId,
    setSubIssueHelpers,
    subIssueHelpers.issue_visibility,
    subIssueOperations,
    workspaceSlug,
  ]);

  useEffect(() => {
    handleFetchSubIssues();

    return () => {
      handleFetchSubIssues();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentIssueId]);

  // render conditions
  const shouldRenderDeleteIssueModal =
    issueCrudState?.delete?.toggle &&
    issueCrudState?.delete?.issue &&
    issueCrudState.delete.parentIssueId &&
    issueCrudState.delete.issue.id;

  const shouldRenderUpdateIssueModal = issueCrudState?.update?.toggle && issueCrudState?.update?.issue;

  return (
    <>
      {subIssueHelpers.issue_visibility.includes(parentIssueId) && (
        <IssueList
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentIssueId={parentIssueId}
          rootIssueId={parentIssueId}
          spacingLeft={6}
          disabled={!disabled}
          handleIssueCrudState={handleIssueCrudState}
          subIssueOperations={subIssueOperations}
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
          onSubmit={async () =>
            await subIssueOperations.deleteSubIssue(
              workspaceSlug,
              projectId,
              issueCrudState?.delete?.parentIssueId as string,
              issueCrudState?.delete?.issue?.id as string
            )
          }
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
            await subIssueOperations.updateSubIssue(
              workspaceSlug,
              projectId,
              parentIssueId,
              _issue.id,
              _issue,
              issueCrudState?.update?.issue,
              true
            );
          }}
        />
      )}
    </>
  );
});
