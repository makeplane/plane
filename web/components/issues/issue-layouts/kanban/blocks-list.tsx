import { memo } from "react";
//types
import { IIssue } from "types";
import { EIssueActions } from "../types";
// components
import { KanbanIssueBlock } from "components/issues";
import { IIssueStore } from "store/issue/issue.store";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProfileIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store_legacy/issues";

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issueMap: IIssueStore;
  issueIds: string[];
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  isDragDisabled: boolean;
  showEmptyGroup: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
}

const KanbanIssueBlocksListMemo: React.FC<IssueBlocksListProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    issueMap,
    issueIds,
    issuesFilter,
    showEmptyGroup,
    isDragDisabled,
    handleIssues,
    quickActions,
    canEditProperties,
  } = props;

  return (
    <>
      {issueIds && issueIds.length > 0 ? (
        <>
          {issueIds.map((issueId, index) => {
            const issue = issueMap.allIssues[issueId];

            if (!issue) return null;

            return (
              <KanbanIssueBlock
                key={`kanban-issue-block-${issue.id}`}
                index={index}
                issue={issue}
                issuesFilter={issuesFilter}
                showEmptyGroup={showEmptyGroup}
                handleIssues={handleIssues}
                quickActions={quickActions}
                columnId={columnId}
                sub_group_id={sub_group_id}
                isDragDisabled={isDragDisabled}
                canEditProperties={canEditProperties}
              />
            );
          })}
        </>
      ) : null}
    </>
  );
};

export const KanbanIssueBlocksList = memo(KanbanIssueBlocksListMemo);
