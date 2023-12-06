import { memo, useRef, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
// components
import { KanBanProperties } from "./properties";
// ui
import { Tooltip } from "@plane/ui";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// types
import { IIssueDisplayProperties, IIssue } from "types";
import { EIssueActions } from "../types";
import { useRouter } from "next/router";
import { MoreHorizontal } from "lucide-react";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  index: number;
  issue: IIssue;
  isDragDisabled: boolean;
  showEmptyGroup: boolean;
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => void;
  quickActions: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    customActionButton?: React.ReactElement
  ) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  isReadOnly: boolean;
}

export const KanBanIssueMemoBlock: React.FC<IssueBlockProps> = (props) => {
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
    isReadOnly,
  } = props;
  // router
  const router = useRouter();

  // states
  const [isMenuActive, setIsMenuActive] = useState(false);

  const menuActionRef = useRef<HTMLDivElement | null>(null);

  const updateIssue = (sub_group_by: string | null, group_by: string | null, issueToUpdate: IIssue) => {
    if (issueToUpdate) handleIssues(sub_group_by, group_by, issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
    });
  };

  let draggableId = issue.id;
  if (columnId) draggableId = `${draggableId}__${columnId}`;
  if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`w-full cursor-pointer text-custom-sidebar-text-400 rounded p-1 hover:bg-custom-background-80 ${
        isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );

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
              <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-custom-background-100/20 z-[99999]" />
            )}
            <div
              className={`text-sm rounded py-2 px-3 shadow-custom-shadow-2xs space-y-2 border-[0.5px] border-custom-border-200 transition-all bg-custom-background-100 ${
                isDragDisabled ? "" : "hover:cursor-grab"
              } ${snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`}`}
            >
              {displayProperties && displayProperties?.key && (
                <div className="relative">
                  <div className="text-xs line-clamp-1 text-custom-text-300">
                    {issue.project_detail.identifier}-{issue.sequence_id}
                  </div>
                  <div
                    className={`absolute -top-1 right-0 hidden group-hover/kanban-block:block ${
                      isMenuActive ? "!block" : ""
                    }`}
                  >
                    {quickActions(
                      !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
                      !columnId && columnId === "null" ? null : columnId,
                      issue,
                      customActionButton
                    )}
                  </div>
                </div>
              )}
              <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
                <div
                  className="line-clamp-2 text-sm font-medium text-custom-text-100"
                  onClick={handleIssuePeekOverview}
                >
                  {issue.name}
                </div>
              </Tooltip>
              <div>
                <KanBanProperties
                  sub_group_id={sub_group_id}
                  columnId={columnId}
                  issue={issue}
                  handleIssues={updateIssue}
                  displayProperties={displayProperties}
                  showEmptyGroup={showEmptyGroup}
                  isReadOnly={isReadOnly}
                />
              </div>
            </div>
          </div>
        )}
      </Draggable>
    </>
  );
};

const validateMemo = (prevProps: IssueBlockProps, nextProps: IssueBlockProps) => {
  if (prevProps.issue != nextProps.issue) return true;
  return false;
};

export const KanbanIssueBlock = memo(KanBanIssueMemoBlock, validateMemo);
