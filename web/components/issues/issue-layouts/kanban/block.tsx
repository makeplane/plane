import { Draggable } from "@hello-pangea/dnd";
// components
import { KanBanProperties } from "./properties";
import { Tooltip } from "@plane/ui";
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
// types
import { IIssueDisplayProperties, IIssue } from "types";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  index: number;
  issue: IIssue;
  isDragDisabled: boolean;
  showEmptyGroup: boolean;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
}

export const KanbanIssueBlock: React.FC<IssueBlockProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    index,
    issue,
    isDragDisabled,
    showEmptyGroup,
    handleIssues,
    quickActions,
    displayProperties,
  } = props;

  const updateIssue = (sub_group_by: string | null, group_by: string | null, issueToUpdate: IIssue) => {
    if (issueToUpdate) handleIssues(sub_group_by, group_by, issueToUpdate, "update");
  };

  return (
    <>
      <Draggable draggableId={issue.id} index={index} isDragDisabled={isDragDisabled}>
        {(provided, snapshot) => (
          <div
            className="group/kanban-block relative p-1.5 hover:cursor-default"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            {issue.tempId !== undefined && (
              <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-custom-background-100/20 z-[99999]" />
            )}
            <div className="absolute top-3 right-3 hidden group-hover/kanban-block:block">
              {quickActions(
                !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
                !columnId && columnId === "null" ? null : columnId,
                issue
              )}
            </div>
            <div
              className={`text-sm rounded py-2 px-3 shadow-custom-shadow-2xs space-y-2 border-[0.5px] border-custom-border-200 transition-all bg-custom-background-100 ${
                isDragDisabled ? "" : "hover:cursor-grab"
              } ${snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`}`}
            >
              {displayProperties && displayProperties?.key && (
                <div className="text-xs line-clamp-1 text-custom-text-300">
                  {issue.project_detail.identifier}-{issue.sequence_id}
                </div>
              )}
              <IssuePeekOverview
                workspaceSlug={issue?.workspace_detail?.slug}
                projectId={issue?.project_detail?.id}
                issueId={issue?.id}
                handleIssue={(issueToUpdate) => {
                  handleIssues(
                    !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
                    !columnId && columnId === "null" ? null : columnId,
                    { ...issue, ...issueToUpdate },
                    "update"
                  );
                }}
              >
                <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
                  <div className="line-clamp-2 text-sm font-medium text-custom-text-100">{issue.name}</div>
                </Tooltip>
              </IssuePeekOverview>
              <div>
                <KanBanProperties
                  sub_group_id={sub_group_id}
                  columnId={columnId}
                  issue={issue}
                  handleIssues={updateIssue}
                  displayProperties={displayProperties}
                  showEmptyGroup={showEmptyGroup}
                />
              </div>
            </div>
          </div>
        )}
      </Draggable>
    </>
  );
};
