import { MutableRefObject } from "react";
import isNil from "lodash/isNil";
import { observer } from "mobx-react";
// types
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  IIssueDisplayProperties,
  TSubGroupedIssues,
  TIssueGroupByOptions,
  TPaginationData,
  TLoader,
} from "@plane/types";
// hooks
import { useMember, useModule, useStates, useLabel, useCycle } from "@/hooks/store";
//
import { getGroupByColumns } from "../utils";
// components
import { HeaderGroupByCard } from "./headers/group-by-card";
import { KanbanGroup } from "./kanban-group";

export interface IKanBan {
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  subGroupBy: TIssueGroupByOptions | undefined;
  groupBy: TIssueGroupByOptions | undefined;
  subGroupId?: string;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  showEmptyGroup?: boolean;
}

export const KanBan: React.FC<IKanBan> = observer((props) => {
  const {
    groupedIssueIds,
    displayProperties,
    subGroupBy,
    groupBy,
    subGroupId = "null",
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
    scrollableContainerRef,
    showEmptyGroup = true,
  } = props;

  const member = useMember();
  const label = useLabel();
  const cycle = useCycle();
  const modules = useModule();
  const state = useStates();

  const groupList = getGroupByColumns(groupBy as GroupByColumnTypes, cycle, modules, label, state, member);

  if (!groupList) return null;

  const visibilityGroupBy = (_list: IGroupByColumn): { showGroup: boolean; showIssues: boolean } => {
    const groupVisibility = {
      showGroup: true,
      showIssues: true,
    };

    if (!showEmptyGroup) {
      groupVisibility.showGroup = (getGroupIssueCount(_list.id, undefined, false) ?? 0) > 0;
    }
    return groupVisibility;
  };

  return (
    <div className={`relative w-full flex gap-2 px-2 ${subGroupBy ? "h-full" : "h-full"}`}>
      {groupList &&
        groupList.length > 0 &&
        groupList.map((subList: IGroupByColumn) => {
          const groupByVisibilityToggle = visibilityGroupBy(subList);

          if (groupByVisibilityToggle.showGroup === false) return <></>;
          return (
            <div
              key={subList.id}
              className={`group relative flex flex-shrink-0 flex-col ${
                groupByVisibilityToggle.showIssues ? `w-[350px]` : ``
              } `}
            >
              {isNil(subGroupBy) && (
                <div className="sticky top-0 z-[2] w-full flex-shrink-0 bg-custom-background-90 py-1">
                  <HeaderGroupByCard
                    groupBy={groupBy}
                    icon={subList.icon}
                    title={subList.name}
                    count={getGroupIssueCount(subList.id, undefined, false) ?? 0}
                  />
                </div>
              )}

              {groupByVisibilityToggle.showIssues && (
                <KanbanGroup
                  groupId={subList.id}
                  groupedIssueIds={groupedIssueIds}
                  displayProperties={displayProperties}
                  subGroupBy={subGroupBy}
                  subGroupId={subGroupId}
                  scrollableContainerRef={scrollableContainerRef}
                  loadMoreIssues={loadMoreIssues}
                  getGroupIssueCount={getGroupIssueCount}
                  getPaginationData={getPaginationData}
                  getIssueLoader={getIssueLoader}
                />
              )}
            </div>
          );
        })}
    </div>
  );
});
