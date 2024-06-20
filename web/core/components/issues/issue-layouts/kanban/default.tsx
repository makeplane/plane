import { MutableRefObject } from "react";
import { observer } from "mobx-react";
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
// constants
// hooks
import { useCycle, useKanbanView, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
// types
// parent components
import { TRenderQuickActions } from "../list/list-view-types";
import { getGroupByColumns, isWorkspaceLevel, GroupDropLocation } from "../utils";
// components
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";

export interface IKanBan {
  issuesMap: IIssueMap;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  orderBy: TIssueOrderByOptions | undefined;
  isDropDisabled?: boolean;
  dropErrorMessage?: string | undefined;
  sub_group_id?: string;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: any;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  disableIssueCreation?: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  showEmptyGroup?: boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issuesMap,
    groupedIssueIds,
    getGroupIssueCount,
    displayProperties,
    sub_group_by,
    group_by,
    sub_group_id = "null",
    updateIssue,
    quickActions,
    kanbanFilters,
    handleKanbanFilters,
    enableQuickIssueCreate,
    quickAddCallback,
    loadMoreIssues,
    disableIssueCreation,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    handleOnDrop,
    showEmptyGroup = true,
    orderBy,
    isDropDisabled,
    dropErrorMessage,
  } = props;

  const storeType = useIssueStoreType();

  const member = useMember();
  const project = useProject();
  const label = useLabel();
  const cycle = useCycle();
  const moduleInfo = useModule();
  const projectState = useProjectState();
  const issueKanBanView = useKanbanView();

  const isDragDisabled = !issueKanBanView?.getCanUserDragDrop(group_by, sub_group_by);

  const list = getGroupByColumns(
    group_by as GroupByColumnTypes,
    project,
    cycle,
    moduleInfo,
    label,
    projectState,
    member,
    true,
    isWorkspaceLevel(storeType)
  );

  if (!list) return null;

  const visibilityGroupBy = (_list: IGroupByColumn): { showGroup: boolean; showIssues: boolean } => {
    if (sub_group_by) {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        groupVisibility.showGroup = (getGroupIssueCount(_list.id, undefined, false) ?? 0) > 0;
      }
      return groupVisibility;
    } else {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        if ((getGroupIssueCount(_list.id, undefined, false) ?? 0) > 0) groupVisibility.showGroup = true;
        else groupVisibility.showGroup = false;
      }
      if (kanbanFilters?.group_by.includes(_list.id)) groupVisibility.showIssues = false;
      return groupVisibility;
    }
  };

  const isGroupByCreatedBy = group_by === "created_by";

  return (
    <div className={`relative w-full flex gap-2 px-2 ${sub_group_by ? "h-full" : "h-full"}`}>
      {list &&
        list.length > 0 &&
        list.map((subList: IGroupByColumn) => {
          const groupByVisibilityToggle = visibilityGroupBy(subList);

          if (groupByVisibilityToggle.showGroup === false) return <></>;
          return (
            <div
              key={subList.id}
              className={`group relative flex flex-shrink-0 flex-col ${
                groupByVisibilityToggle.showIssues ? `w-[350px]` : ``
              } `}
            >
              {sub_group_by === null && (
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 bg-custom-background-90 py-1">
                  <HeaderGroupByCard
                    sub_group_by={sub_group_by}
                    group_by={group_by}
                    column_id={subList.id}
                    icon={subList.icon}
                    title={subList.name}
                    count={getGroupIssueCount(subList.id, undefined, false) ?? 0}
                    issuePayload={subList.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    addIssuesToView={addIssuesToView}
                    kanbanFilters={kanbanFilters}
                    handleKanbanFilters={handleKanbanFilters}
                  />
                </div>
              )}

              {groupByVisibilityToggle.showIssues && (
                <KanbanGroup
                  groupId={subList.id}
                  issuesMap={issuesMap}
                  groupedIssueIds={groupedIssueIds}
                  displayProperties={displayProperties}
                  sub_group_by={sub_group_by}
                  group_by={group_by}
                  orderBy={orderBy}
                  sub_group_id={sub_group_id}
                  isDragDisabled={isDragDisabled}
                  isDropDisabled={!!subList.isDropDisabled || !!isDropDisabled}
                  dropErrorMessage={subList.dropErrorMessage ?? dropErrorMessage}
                  updateIssue={updateIssue}
                  quickActions={quickActions}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  quickAddCallback={quickAddCallback}
                  disableIssueCreation={disableIssueCreation}
                  canEditProperties={canEditProperties}
                  scrollableContainerRef={scrollableContainerRef}
                  loadMoreIssues={loadMoreIssues}
                  handleOnDrop={handleOnDrop}
                />
              )}
            </div>
          );
        })}
    </div>
  );
});
