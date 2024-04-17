import { MutableRefObject, memo, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react-lite";
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
// hooks
import { ControlLink, DropIndicator, Tooltip } from "@plane/ui";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { cn } from "@/helpers/common.helper";
import { useApplication, useIssueDetail, useKanbanView, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { IssueProperties } from "../properties/all-properties";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
// ui
// types
// helper

interface IssueBlockProps {
  peekIssueId?: string;
  issueId: string;
  issuesMap: IIssueMap;
  displayProperties: IIssueDisplayProperties | undefined;
  isDragDisabled: boolean;
  draggableId: string;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  issueIds: string[]; //DO NOT REMOVE< needed to force render for virtualization
}

interface IssueDetailsBlockProps {
  issue: TIssue;
  displayProperties: IIssueDisplayProperties | undefined;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  isReadOnly: boolean;
}

const KanbanIssueDetailsBlock: React.FC<IssueDetailsBlockProps> = observer((props: IssueDetailsBlockProps) => {
  const { issue, updateIssue, quickActions, isReadOnly, displayProperties } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { getProjectIdentifierById } = useProject();

  const handleEventPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
        <div className="relative">
          <div className="line-clamp-1 text-xs text-custom-text-300">
            {getProjectIdentifierById(issue.project_id)}-{issue.sequence_id}
          </div>
          <div
            className="absolute -top-1 right-0 hidden group-hover/kanban-block:block"
            onClick={handleEventPropagation}
          >
            {quickActions(issue)}
          </div>
        </div>
      </WithDisplayPropertiesHOC>

      {issue?.is_draft ? (
        <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
          <span>{issue.name}</span>
        </Tooltip>
      ) : (
        <div className="w-full line-clamp-1 text-sm text-custom-text-100 mb-1.5">
          <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
            <span>{issue.name}</span>
          </Tooltip>
        </div>
      )}

      <IssueProperties
        className="flex flex-wrap items-center gap-2 whitespace-nowrap text-custom-text-300 pt-1.5"
        issue={issue}
        displayProperties={displayProperties}
        activeLayout="Kanban"
        updateIssue={updateIssue}
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
    updateIssue,
    quickActions,
    canEditProperties,
    scrollableContainerRef,
    issueIds,
  } = props;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { peekIssue, setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    peekIssue?.issueId !== issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const issue = issuesMap[issueId];

  const { setIsDragging: setIsKanbanDragging } = useKanbanView();

  const [isDraggingOverBlock, setIsDraggingOverBlock] = useState(false);
  const [isCurrentBlockDragging, setIsCurrentBlockDragging] = useState(false);

  // Make Issue block both as as Draggable and,
  // as a DropTarget for other issues being dragged to get the location of drop
  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !isDragDisabled,
        getInitialData: () => ({ id: issue?.id, type: "ISSUE" }),
        onDragStart: () => {
          setIsCurrentBlockDragging(true);
          setIsKanbanDragging(true);
        },
        onDrop: () => {
          setIsKanbanDragging(false);
          setIsCurrentBlockDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: (payload) => payload.source?.data?.id !== issue?.id,
        getData: () => ({ id: issue?.id, type: "ISSUE" }),
        onDragEnter: () => {
          setIsDraggingOverBlock(true);
        },
        onDragLeave: () => {
          setIsDraggingOverBlock(false);
        },
        onDrop: () => {
          setIsDraggingOverBlock(false);
        },
      })
    );
  }, [cardRef?.current, issue?.id, setIsCurrentBlockDragging, setIsDraggingOverBlock]);

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);

  return (
    <>
      <DropIndicator isVisible={!isCurrentBlockDragging && isDraggingOverBlock} />
      <div
        // make Z-index higher at the beginning of drag, to have a issue drag image of issue block without any overlaps
        className={cn("group/kanban-block relative p-1.5", { "z-[1]": isCurrentBlockDragging })}
        onDragStart={() => !isDragDisabled && setIsCurrentBlockDragging(true)}
      >
        <ControlLink
          id={`issue-${issue.id}`}
          href={`/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
            issue.id
          }`}
          target="_blank"
          onClick={() => handleIssuePeekOverview(issue)}
          disabled={!!issue?.tempId}
        >
          <div
            className={cn(
              "rounded border-[0.5px] outline-[0.5px] outline-transparent w-full border-custom-border-200 bg-custom-background-100 text-sm transition-all hover:border-custom-border-400",
              { "hover:cursor-pointer": !isDragDisabled },
              { "border border-custom-primary-70 hover:border-custom-primary-70": peekIssueId === issue.id },
              { "bg-custom-background-80 z-[100]": isCurrentBlockDragging }
            )}
            ref={cardRef}
          >
            <RenderIfVisible
              classNames="space-y-2 px-3 py-2"
              root={scrollableContainerRef}
              defaultHeight="100px"
              horizontalOffset={50}
              changingReference={issueIds}
            >
              <KanbanIssueDetailsBlock
                issue={issue}
                displayProperties={displayProperties}
                updateIssue={updateIssue}
                quickActions={quickActions}
                isReadOnly={!canEditIssueProperties}
              />
            </RenderIfVisible>
          </div>
        </ControlLink>
      </div>
    </>
  );
});

KanbanIssueBlock.displayName = "KanbanIssueBlock";
