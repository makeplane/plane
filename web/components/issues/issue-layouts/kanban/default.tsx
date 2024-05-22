import { MutableRefObject } from "react";
import { observer } from "mobx-react-lite";
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  TIssue,
  IIssueDisplayProperties,
  IIssueMap,
  TSubGroupedIssues,
  TUnGroupedIssues,
  TIssueKanbanFilters,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
} from "@plane/types";
// constants
// hooks
import { useCycle, useKanbanView, useLabel, useMember, useModule, useProject, useProjectState } from "@/hooks/store";
// types
// parent components
import { TRenderQuickActions } from "../list/list-view-types";
import { getGroupByColumns, isWorkspaceLevel, GroupDropLocation } from "../utils";
// components
import { KanbanStoreType } from "./base-kanban-root";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";

export interface IKanBan {
  issuesMap: IIssueMap;
  issueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  sub_group_by: TIssueGroupByOptions | undefined;
  group_by: TIssueGroupByOptions | undefined;
  orderBy: TIssueOrderByOptions | undefined;
  isDropDisabled?: boolean;
  dropErrorMessage?: string | undefined;
  sub_group_id?: string;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  kanbanFilters: TIssueKanbanFilters;
  handleKanbanFilters: any;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  disableIssueCreation?: boolean;
  storeType: KanbanStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
  canEditProperties: (projectId: string | undefined) => boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  handleOnDrop: (source: GroupDropLocation, destination: GroupDropLocation) => Promise<void>;
  showEmptyGroup?: boolean;
  subGroupIssueHeaderCount?: (listId: string) => number;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    issuesMap,
    issueIds,
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
    viewId,
    disableIssueCreation,
    storeType,
    addIssuesToView,
    canEditProperties,
    scrollableContainerRef,
    handleOnDrop,
    showEmptyGroup = true,
    subGroupIssueHeaderCount,
    orderBy,
    isDropDisabled,
    dropErrorMessage,
  } = props;

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
        groupVisibility.showGroup = subGroupIssueHeaderCount ? subGroupIssueHeaderCount(_list.id) > 0 : true;
      }
      return groupVisibility;
    } else {
      const groupVisibility = {
        showGroup: true,
        showIssues: true,
      };
      if (!showEmptyGroup) {
        if ((issueIds as TGroupedIssues)?.[_list.id]?.length > 0) groupVisibility.showGroup = true;
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
                    count={(issueIds as TGroupedIssues)?.[subList.id]?.length || 0}
                    issuePayload={subList.payload}
                    disableIssueCreation={disableIssueCreation || isGroupByCreatedBy}
                    storeType={storeType}
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
                  issueIds={issueIds}
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
                  viewId={viewId}
                  disableIssueCreation={disableIssueCreation}
                  canEditProperties={canEditProperties}
                  scrollableContainerRef={scrollableContainerRef}
                  handleOnDrop={handleOnDrop}
                />
              )}
            </div>
          );
        })}
    </div>
  );
});
