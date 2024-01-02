import { memo } from "react";
import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
// components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { IssueProperties } from "../properties/all-properties";
// ui
import { Tooltip } from "@plane/ui";
// types
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
import { EIssueActions } from "../types";
import { useRouter } from "next/router";
import { useProject } from "hooks/store";

interface IssueBlockProps {
  issueId: string;
  issuesMap: IIssueMap;
  displayProperties: IIssueDisplayProperties | undefined;
  isDragDisabled: boolean;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

interface IssueDetailsBlockProps {
  issue: TIssue;
  displayProperties: IIssueDisplayProperties | undefined;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue) => React.ReactNode;
  isReadOnly: boolean;
}

const KanbanIssueDetailsBlock: React.FC<IssueDetailsBlockProps> = observer((props: IssueDetailsBlockProps) => {
  const { issue, handleIssues, quickActions, isReadOnly, displayProperties } = props;

  const router = useRouter();

  // hooks
  const { getProjectById } = useProject();

  const updateIssue = (issueToUpdate: TIssue) => {
    if (issueToUpdate) handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project_id },
    });
  };

  return (
    <>
      <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-xs text-custom-text-300">
            {getProjectById(issue.project_id)?.identifier}-{issue.sequence_id}
          </div>
          <div className="absolute -top-1 right-0 hidden group-hover/kanban-block:block">{quickActions(issue)}</div>
        </div>
      </WithDisplayPropertiesHOC>
      <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
        <div className="line-clamp-2 text-sm font-medium text-custom-text-100" onClick={handleIssuePeekOverview}>
          {issue.name}
        </div>
      </Tooltip>
      <IssueProperties
        className="flex flex-wrap items-center gap-2 whitespace-nowrap"
        issue={issue}
        displayProperties={displayProperties}
        handleIssues={updateIssue}
        isReadOnly={isReadOnly}
      />
    </>
  );
});

export const KanbanIssueBlock: React.FC<IssueBlockProps> = memo((props) => {
  const {
    issueId,
    issuesMap,
    displayProperties,
    isDragDisabled,
    handleIssues,
    quickActions,
    canEditProperties,
    provided,
    snapshot,
  } = props;

  const issue = issuesMap[issueId];

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);

  return (
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
        <KanbanIssueDetailsBlock
          issue={issue}
          displayProperties={displayProperties}
          handleIssues={handleIssues}
          quickActions={quickActions}
          isReadOnly={!canEditIssueProperties}
        />
      </div>
    </div>
  );
});

KanbanIssueBlock.displayName = "KanbanIssueBlock";
