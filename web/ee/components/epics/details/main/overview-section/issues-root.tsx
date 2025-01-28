"use client";
import React, { FC, useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssueServiceType } from "@plane/constants";
import { TIssue } from "@plane/types";
import { getButtonStyling, LayersIcon } from "@plane/ui";
// components
import { SubIssuesActionButton } from "@/components/issues";
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
import { IssueList } from "@/components/issues/sub-issues/issues-list";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web imports
import { SectionEmptyState } from "@/plane-web/components/common/layout/main/common";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const EpicIssuesOverviewRoot: FC<Props> = observer((props) => {
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
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { toggleCreateIssueModal, toggleDeleteIssueModal } = useIssueDetail();

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

  useEffect(() => {
    handleFetchSubIssues();

    return () => {
      handleFetchSubIssues();
    };
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
  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0;

  if (!hasSubIssues) {
    return (
      <SectionEmptyState
        heading="No issues yet"
        subHeading="Start adding issues manage and track the progress of the epic."
        icon={<LayersIcon className="size-4" />}
        actionElement={
          <SubIssuesActionButton
            issueId={epicId}
            issueServiceType={EIssueServiceType.EPICS}
            disabled={disabled}
            customButton={
              <span className={cn(getButtonStyling("accent-primary", "sm"), "font-medium px-2 py-1")}>Add issues</span>
            }
          />
        }
      />
    );
  }

  return (
    <>
      <IssueList
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={epicId}
        rootIssueId={epicId}
        spacingLeft={6}
        disabled={!disabled}
        handleIssueCrudState={handleIssueCrudState}
        subIssueOperations={subIssueOperations}
        issueServiceType={EIssueServiceType.EPICS}
      />

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
              epicId,
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
