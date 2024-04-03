import { useRef } from "react";
import { observer } from "mobx-react";
//types
import {
  GroupByColumnTypes,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  TIssueMap,
  IGroupByColumn,
} from "@plane/types";
// components
// hooks
import { useCycle, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// utils
import { getGroupByColumns, isWorkspaceLevel } from "../utils";
//components
import { ListGroup } from "./list-group";

export interface IGroupByList {
  groupedIssueIds: TGroupedIssues;
  issuesMap: TIssueMap;
  group_by: GroupByColumnTypes | null;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  enableIssueQuickAdd: boolean;
  showEmptyGroup?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  isCompletedCycle?: boolean;
  loadMoreIssues: (groupId?: string) => void;
}

const GroupByList: React.FC<IGroupByList> = observer((props) => {
  const {
    groupedIssueIds,
    issuesMap,
    group_by,
    updateIssue,
    quickActions,
    displayProperties,
    enableIssueQuickAdd,
    showEmptyGroup,
    canEditProperties,
    quickAddCallback,
    disableIssueCreation,
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
    group_by,
    project,
    cycle,
    projectModule,
    label,
    projectState,
    member,
    true,
    isWorkspaceLevel(storeType)
  );

  if (!groups) return null;

  return (
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
            projectState={projectState}
            updateIssue={updateIssue}
            quickActions={quickActions}
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
  );
});

export interface IList {
  groupedIssueIds: TGroupedIssues;
  issuesMap: TIssueMap;
  group_by: GroupByColumnTypes | null;
  updateIssue:
    | ((projectId: string | null | undefined, issueId: string, data: Partial<TIssue>) => Promise<void>)
    | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup: boolean;
  enableIssueQuickAdd: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  loadMoreIssues: (groupId?: string) => void;
  isCompletedCycle?: boolean;
}

export const List: React.FC<IList> = (props) => {
  const {
    groupedIssueIds,
    issuesMap,
    group_by,
    updateIssue,
    quickActions,
    quickAddCallback,
    displayProperties,
    showEmptyGroup,
    enableIssueQuickAdd,
    canEditProperties,
    disableIssueCreation,
    addIssuesToView,
    loadMoreIssues,
    isCompletedCycle = false,
  } = props;

  return (
    <div className="relative h-full w-full">
      <GroupByList
        groupedIssueIds={groupedIssueIds}
        issuesMap={issuesMap}
        group_by={group_by}
        loadMoreIssues={loadMoreIssues}
        updateIssue={updateIssue}
        quickActions={quickActions}
        displayProperties={displayProperties}
        enableIssueQuickAdd={enableIssueQuickAdd}
        showEmptyGroup={showEmptyGroup}
        canEditProperties={canEditProperties}
        quickAddCallback={quickAddCallback}
        disableIssueCreation={disableIssueCreation}
        addIssuesToView={addIssuesToView}
        isCompletedCycle={isCompletedCycle}
      />
    </div>
  );
};
