import { memo } from "react";
<<<<<<< HEAD
import { Draggable } from "@hello-pangea/dnd";
=======
import { Draggable, DraggableStateSnapshot } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
// components
import { IssueProperties } from "../properties/all-properties";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";
import { EIssueActions } from "../types";
import { useRouter } from "next/router";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProfileIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store_legacy/issues";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  index: number;
  issue: IIssue;
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  isDragDisabled: boolean;
  showEmptyGroup: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
}

interface IssueDetailsBlockProps {
  issue: IIssue;
  showEmptyGroup: boolean;
  issuesFilter:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue) => React.ReactNode;
  isReadOnly: boolean;
  snapshot: DraggableStateSnapshot;
  isDragDisabled: boolean;
}

const KanbanIssueDetailsBlock: React.FC<IssueDetailsBlockProps> = (props) => {
<<<<<<< HEAD
  const { issue, showEmptyGroup, handleIssues, quickActions, isReadOnly, issuesFilter } = props;
=======
  const {
    sub_group_id,
    columnId,
    issue,
    showEmptyGroup,
    handleIssues,
    quickActions,
    displayProperties,
    isReadOnly,
    snapshot,
    isDragDisabled,
  } = props;
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434

  const router = useRouter();

  const updateIssue = (issueToUpdate: IIssue) => {
    if (issueToUpdate) handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { query } = router;
    if (event.ctrlKey || event.metaKey) {
      const issueUrl = `/${issue.workspace_detail.slug}/projects/${issue.project_detail.id}/issues/${issue?.id}`;
      window.open(issueUrl, "_blank"); // Open link in a new tab
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
      });
    }
  };

  return (
<<<<<<< HEAD
    <>
      <WithDisplayPropertiesHOC issuesFilter={issuesFilter} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-xs text-custom-text-300">
=======
    <div
      className={`flex flex-col space-y-2 cursor-pointer rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm shadow-custom-shadow-2xs transition-all w-full ${
        isDragDisabled ? "" : "hover:cursor-grab"
      } ${snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`}`}
      onClick={handleIssuePeekOverview}
    >
      {displayProperties && displayProperties?.key && (
        <div className="relative w-full ">
          <div className="line-clamp-1 text-xs text-left text-custom-text-300">
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
            {issue.project_detail.identifier}-{issue.sequence_id}
          </div>
          <div className="absolute -top-1 right-0 hidden group-hover/kanban-block:block">{quickActions(issue)}</div>
        </div>
      </WithDisplayPropertiesHOC>
      <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
        <div className="line-clamp-2 text-sm font-medium text-custom-text-100">{issue.name}</div>
      </Tooltip>
      <div>
        <IssueProperties
          className="flex flex-wrap items-center gap-2 whitespace-nowrap"
          issue={issue}
          issuesFilter={issuesFilter}
          handleIssues={updateIssue}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
};

const KanbanIssueMemoBlock = memo(KanbanIssueDetailsBlock);

export const KanbanIssueBlock: React.FC<IssueBlockProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    index,
    issue,
    issuesFilter,
    isDragDisabled,
    showEmptyGroup,
    handleIssues,
    quickActions,
    canEditProperties,
  } = props;

  let draggableId = issue.id;
  if (columnId) draggableId = `${draggableId}__${columnId}`;
  if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

  const canEditIssueProperties = canEditProperties(issue.project);

  return (
    <>
      <Draggable draggableId={draggableId} index={index} isDragDisabled={!canEditIssueProperties}>
        {(provided, snapshot) => (
          <div
            className="group/kanban-block relative p-1.5"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            {issue.tempId !== undefined && (
              <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
            )}
<<<<<<< HEAD
            <div
              className={`space-y-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm shadow-custom-shadow-2xs transition-all ${
                isDragDisabled ? "" : "hover:cursor-grab"
              } ${snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`}`}
            >
              <KanbanIssueMemoBlock
                issue={issue}
                issuesFilter={issuesFilter}
                showEmptyGroup={showEmptyGroup}
                handleIssues={handleIssues}
                quickActions={quickActions}
                isReadOnly={!canEditIssueProperties}
              />
            </div>
=======
            <KanbanIssueMemoBlock
              sub_group_id={sub_group_id}
              columnId={columnId}
              issue={issue}
              showEmptyGroup={showEmptyGroup}
              handleIssues={handleIssues}
              quickActions={quickActions}
              displayProperties={displayProperties}
              isReadOnly={!canEditIssueProperties}
              snapshot={snapshot}
              isDragDisabled={isDragDisabled}
            />
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
          </div>
        )}
      </Draggable>
    </>
  );
};
