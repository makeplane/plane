import { memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
// components
import { IssueProperties } from "../properties/all-properties";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssue, IIssueDisplayProperties, IIssueMap } from "types";
import { EIssueActions } from "../types";
import { useRouter } from "next/router";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  index: number;
  issueId: string;
  issuesMap: IIssueMap;
  displayProperties: IIssueDisplayProperties;
  isDragDisabled: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
}

interface IssueDetailsBlockProps {
  issue: IIssue;
  displayProperties: IIssueDisplayProperties;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue) => React.ReactNode;
  isReadOnly: boolean;
}

const KanbanIssueDetailsBlock: React.FC<IssueDetailsBlockProps> = (props) => {
  const { issue, handleIssues, quickActions, isReadOnly, displayProperties } = props;

  const router = useRouter();

  const updateIssue = (issueToUpdate: IIssue) => {
    if (issueToUpdate) handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
    });
  };

  return (
    <>
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-xs text-custom-text-300">
            {issue.project_detail.identifier}-{issue.sequence_id}
          </div>
          <div className="absolute -top-1 right-0 hidden group-hover/kanban-block:block">{quickActions(issue)}</div>
        </div>
      </WithDisplayPropertiesHOC>
      <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
        <div className="line-clamp-2 text-sm font-medium text-custom-text-100" onClick={handleIssuePeekOverview}>
          {issue.name}
        </div>
      </Tooltip>
      <div>
        <IssueProperties
          className="flex flex-wrap items-center gap-2 whitespace-nowrap"
          issue={issue}
          displayProperties={displayProperties}
          handleIssues={updateIssue}
          isReadOnly={isReadOnly}
        />
      </div>
    </>
  );
};

const KanbanIssueMemoBlock = memo(KanbanIssueDetailsBlock);

export const KanbanIssueBlock: React.FC<IssueBlockProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    index,
    issueId,
    issuesMap,
    displayProperties,
    isDragDisabled,
    handleIssues,
    quickActions,
    canEditProperties,
  } = props;

  let draggableId = issueId;
  if (columnId) draggableId = `${draggableId}__${columnId}`;
  if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

  const issue = issuesMap[issueId];

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project);

  return (
    <>
      <Draggable draggableId={draggableId} index={index}>
        {(provided, snapshot) => (
          <div
            className="group/kanban-block relative p-1.5 hover:cursor-default"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            {issue.tempId !== undefined && (
              <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
            )}
            <div
              className={`space-y-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm shadow-custom-shadow-2xs transition-all ${
                isDragDisabled ? "" : "hover:cursor-grab"
              } ${snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`}`}
            >
              <KanbanIssueMemoBlock
                issue={issue}
                displayProperties={displayProperties}
                handleIssues={handleIssues}
                quickActions={quickActions}
                isReadOnly={!canEditIssueProperties}
              />
            </div>
          </div>
        )}
      </Draggable>
    </>
  );
};
