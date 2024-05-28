import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// components
import {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  IGroupByColumn,
  TIssueOrderByOptions,
  TIssueGroupByOptions,
} from "@plane/types";
// hooks
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// utils
import { getGroupByColumns, isWorkspaceLevel, GroupDropLocation } from "../utils";
import { ListGroup } from "./list-group";
import { TRenderQuickActions } from "./list-view-types";

export interface IList {
  groupedIssueIds: TGroupedIssues;
  issuesMap: TIssueMap;
  group_by: TIssueGroupByOptions | null;
  orderBy: TIssueOrderByOptions | undefined;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isCompletedCycle?: boolean;
  loadMoreIssues: (groupId?: string) => void;
}

export const List: React.FC<IList> = observer((props) => {
  const {
    groupedIssueIds,
    issuesMap,
    group_by,
    orderBy,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    disableIssueCreation,
    handleOnDrop,
    addIssuesToView,
    isCompletedCycle = false,
    loadMoreIssues,
  } = props;

  const storeType = useIssueStoreType();
  // store hooks
  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const projectState = useProjectState();
  const cycle = useCycle();
  const projectModule = useModule();

  const intersectionRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useIntersectionObserver(containerRef, intersectionRef, loadMoreIssues, `50% 0% 50% 0%`);

  const groups = getGroupByColumns(
    group_by as GroupByColumnTypes,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member,
    true,
    isWorkspaceLevel(storeType)
  );

  // Enable Auto Scroll for Main Kanban
  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, [containerRef]);

  if (!groups) return null;

  const getGroupIndex = (groupId: string | undefined) => groups.findIndex(({ id }) => id === groupId);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="vertical-scrollbar scrollbar-lg relative h-full w-full overflow-auto vertical-scrollbar-margin-top-md"
      >
        {groups &&
          groups.length > 0 &&
          groups.map((group: IGroupByColumn) => (
            <ListGroup
              key={group.id}
              groupIssueIds={groupedIssueIds?.[group.id]}
              issuesMap={issuesMap}
              group_by={group_by}
              group={group}
              updateIssue={updateIssue}
              quickActions={quickActions}
              orderBy={orderBy}
              getGroupIndex={getGroupIndex}
              handleOnDrop={handleOnDrop}
              displayProperties={displayProperties}
              enableIssueQuickAdd={enableIssueQuickAdd}
              showEmptyGroup={showEmptyGroup}
              canEditProperties={canEditProperties}
              quickAddCallback={quickAddCallback}
              disableIssueCreation={disableIssueCreation}
              addIssuesToView={addIssuesToView}
              isCompletedCycle={isCompletedCycle}
              loadMoreIssues={loadMoreIssues}
              containerRef={containerRef}
            />
          ))}
      </div>
    </div>
  );
});
