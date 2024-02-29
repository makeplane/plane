import { MutableRefObject, memo } from "react";
import { Draggable, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useIssueDetail, useProject } from "hooks/store";
// components
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { IssueProperties } from "../properties/all-properties";
// ui
import { Tooltip, ControlLink } from "@plane/ui";
// types
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
import { EIssueActions } from "../types";
// helper
import { cn } from "helpers/common.helper";
import RenderIfVisible from "components/core/render-if-visible-HOC";

interface IssueBlockProps {
  peekIssueId?: string;
  issueId: string;
  issuesMap: IIssueMap;
  displayProperties: IIssueDisplayProperties | undefined;
  isDragDisabled: boolean;
  draggableId: string;
  index: number;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isDragStarted?: boolean;
  issueIds: string[]; //DO NOT REMOVE< needed to force render for virtualization
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
  // hooks
  const { getProjectIdentifierById } = useProject();
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { setPeekIssue } = useIssueDetail();

  const updateIssue = async (issueToUpdate: TIssue) => {
    if (issueToUpdate) await handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  return (
    <>
      <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-xs text-custom-text-300">
            {getProjectIdentifierById(issue.project_id)}-{issue.sequence_id}
          </div>
          <div className="absolute -top-1 right-0 hidden group-hover/kanban-block:block">{quickActions(issue)}</div>
        </div>
      </WithDisplayPropertiesHOC>

      {issue?.is_draft ? (
        <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
          <span>{issue.name}</span>
        </Tooltip>
      ) : (
        <ControlLink
          href={`/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archived-issues" : "issues"}/${
            issue.id
          }`}
          target="_blank"
          onClick={() => handleIssuePeekOverview(issue)}
          className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
          disabled={!!issue?.tempId}
        >
          <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
            <span>{issue.name}</span>
          </Tooltip>
        </ControlLink>
      )}

      <IssueProperties
        className="flex flex-wrap items-center gap-2 whitespace-nowrap"
        issue={issue}
        displayProperties={displayProperties}
        activeLayout="Kanban"
        handleIssues={updateIssue}
        isReadOnly={isReadOnly}
      />
    </>
  );
});

export const KanbanIssueBlock: React.FC<IssueBlockProps> = memo((props) => {
  const {
    peekIssueId,
    issueId,
    issuesMap,
    displayProperties,
    isDragDisabled,
    draggableId,
    index,
    handleIssues,
    quickActions,
    canEditProperties,
    scrollableContainerRef,
    isDragStarted,
    issueIds,
  } = props;

  const issue = issuesMap[issueId];

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);

  return (
    <Draggable
      key={draggableId}
      draggableId={draggableId}
      index={index}
      isDragDisabled={!canEditIssueProperties || isDragDisabled}
    >
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          className="group/kanban-block relative p-1.5 hover:cursor-default"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          <div
            className={cn(
              "rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 text-sm transition-all hover:border-custom-border-400",
              { "hover:cursor-grab": !isDragDisabled },
              { "border-custom-primary-100": snapshot.isDragging },
              { "border border-custom-primary-70 hover:border-custom-primary-70": peekIssueId === issue.id }
            )}
          >
            <RenderIfVisible
              classNames="space-y-2 px-3 py-2"
              root={scrollableContainerRef}
              defaultHeight="100px"
              horizonatlOffset={50}
              alwaysRender={snapshot.isDragging}
              pauseHeightUpdateWhileRendering={isDragStarted}
              changingReference={issueIds}
            >
              <KanbanIssueDetailsBlock
                issue={issue}
                displayProperties={displayProperties}
                handleIssues={handleIssues}
                quickActions={quickActions}
                isReadOnly={!canEditIssueProperties}
              />
            </RenderIfVisible>
          </div>
        </div>
      )}
    </Draggable>
  );
});

KanbanIssueBlock.displayName = "KanbanIssueBlock";
