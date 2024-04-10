import { MutableRefObject, memo, useEffect, useRef, useState } from "react";
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { observer } from "mobx-react-lite";
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
// hooks
import { Tooltip, ControlLink } from "@plane/ui";
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
        <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
          <span className="pb-1.5">{issue.name}</span>
        </Tooltip>
      ) : (
        <ControlLink
          id={`issue-${issue.id}`}
          href={`/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
            issue.id
          }`}
          target="_blank"
          onClick={() => handleIssuePeekOverview(issue)}
          className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100 pb-1.5"
          disabled={!!issue?.tempId}
        >
          <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
            <span>{issue.name}</span>
          </Tooltip>
        </ControlLink>
      )}

      <IssueProperties
        className="flex flex-wrap items-center gap-2 whitespace-nowrap"
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
  const issue = issuesMap[issueId];

  const {setIsDragging: setIsKanbanDragging} =useKanbanView();

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = cardRef.current;

    if(!element) return;

    return combine(draggable({
      element,
      getInitialData: () => ({id: issue.id, type: "ISSUE"}),
      onDragStart: () => {setIsKanbanDragging(true);
        setIsDragging(true)},
        onDrop: () => {setIsKanbanDragging(false); setIsDragging(false)},
    }
    ),
    dropTargetForElements(
      {
      element,
      canDrop: (payload) => payload.source.data.id !== issue.id,
      getData: () => ({id: issue.id, type: "ISSUE"}),
      onDragEnter: () =>{
        setIsDraggingOver(true)
      },
      onDragLeave: () => {
        setIsDraggingOver(false)
      },
      onDrop: () => {
        setIsDraggingOver(false)
      },
  })
    )
  }, [cardRef?.current, issue.id, setIsDragging, setIsDraggingOver])

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);

  return (
    <div className="group/kanban-block p-1.5">
          <div className={cn("block h-[2px] w-full",{"bg-custom-primary-100": !isDragging && isDraggingOver})}/>
          <div
            className={cn(
              "rounded border-[0.5px] outline-[0.5px] outline-transparent w-full border-custom-border-200 bg-custom-background-100 text-sm transition-all hover:border-custom-border-400",
              { "hover:cursor-grab": !isDragDisabled },
              { "border border-custom-primary-70 hover:border-custom-primary-70": peekIssueId === issue.id },
              {"bg-custom-background-80 z-[100] opacity-75": isDragging}
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
          </div>
  );
});

KanbanIssueBlock.displayName = "KanbanIssueBlock";
