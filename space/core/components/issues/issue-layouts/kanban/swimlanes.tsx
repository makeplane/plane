import { MutableRefObject, useState } from "react";
import { observer } from "mobx-react";
// types
import {
  GroupByColumnTypes,
  IGroupByColumn,
  TGroupedIssues,
  IIssueDisplayProperties,
  TSubGroupedIssues,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TPaginationData,
  TLoader,
} from "@plane/types";
// hooks
import { useMember, useModule, useStates, useLabel, useCycle } from "@/hooks/store";
//
import { getGroupByColumns } from "../utils";
import { KanBan } from "./default";
import { HeaderGroupByCard } from "./headers/group-by-card";
import { HeaderSubGroupByCard } from "./headers/sub-group-by-card";

export interface IKanBanSwimLanes {
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  displayProperties: IIssueDisplayProperties | undefined;
  subGroupBy: TIssueGroupByOptions | undefined;
  groupBy: TIssueGroupByOptions | undefined;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  showEmptyGroup: boolean;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  orderBy: TIssueOrderByOptions | undefined;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = observer((props) => {
  const {
    groupedIssueIds,
    displayProperties,
    subGroupBy,
    groupBy,
    orderBy,
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
    showEmptyGroup,
    scrollableContainerRef,
  } = props;

  const member = useMember();
  const label = useLabel();
  const cycle = useCycle();
  const modules = useModule();
  const state = useStates();

  const groupByList = getGroupByColumns(groupBy as GroupByColumnTypes, cycle, modules, label, state, member);
  const subGroupByList = getGroupByColumns(subGroupBy as GroupByColumnTypes, cycle, modules, label, state, member);

  if (!groupByList || !subGroupByList) return null;

  return (
    <div className="relative">
      <div className="sticky top-0 z-[4] h-[50px] bg-custom-background-90 px-2">
        <SubGroupSwimlaneHeader
          groupBy={groupBy}
          subGroupBy={subGroupBy}
          groupList={groupByList}
          showEmptyGroup={showEmptyGroup}
          getGroupIssueCount={getGroupIssueCount}
        />
      </div>

      {subGroupBy && (
        <SubGroupSwimlane
          groupList={subGroupByList}
          groupedIssueIds={groupedIssueIds}
          displayProperties={displayProperties}
          groupBy={groupBy}
          subGroupBy={subGroupBy}
          orderBy={orderBy}
          loadMoreIssues={loadMoreIssues}
          getGroupIssueCount={getGroupIssueCount}
          getPaginationData={getPaginationData}
          getIssueLoader={getIssueLoader}
          showEmptyGroup={showEmptyGroup}
          scrollableContainerRef={scrollableContainerRef}
        />
      )}
    </div>
  );
});

interface ISubGroupSwimlaneHeader {
  subGroupBy: TIssueGroupByOptions | undefined;
  groupBy: TIssueGroupByOptions | undefined;
  groupList: IGroupByColumn[];
  showEmptyGroup: boolean;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
}

const visibilitySubGroupByGroupCount = (subGroupIssueCount: number, showEmptyGroup: boolean): boolean => {
  let subGroupHeaderVisibility = true;

  if (showEmptyGroup) subGroupHeaderVisibility = true;
  else {
    if (subGroupIssueCount > 0) subGroupHeaderVisibility = true;
    else subGroupHeaderVisibility = false;
  }

  return subGroupHeaderVisibility;
};

const SubGroupSwimlaneHeader: React.FC<ISubGroupSwimlaneHeader> = observer(
  ({ subGroupBy, groupBy, groupList, showEmptyGroup, getGroupIssueCount }) => (
    <div className="relative flex h-max min-h-full w-full items-center gap-2">
      {groupList &&
        groupList.length > 0 &&
        groupList.map((group: IGroupByColumn) => {
          const groupCount = getGroupIssueCount(group.id, undefined, false) ?? 0;

          const subGroupByVisibilityToggle = visibilitySubGroupByGroupCount(groupCount, showEmptyGroup);

          if (subGroupByVisibilityToggle === false) return <></>;

          return (
            <div key={`${subGroupBy}_${group.id}`} className="flex w-[350px] flex-shrink-0 flex-col">
              <HeaderGroupByCard groupBy={groupBy} icon={group.icon} title={group.name} count={groupCount} />
            </div>
          );
        })}
    </div>
  )
);

interface ISubGroupSwimlane extends ISubGroupSwimlaneHeader {
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  orderBy: TIssueOrderByOptions | undefined;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
}

const SubGroupSwimlane: React.FC<ISubGroupSwimlane> = observer((props) => {
  const {
    groupedIssueIds,
    subGroupBy,
    groupBy,
    groupList,
    displayProperties,
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
    showEmptyGroup,
    scrollableContainerRef,
  } = props;

  return (
    <div className="relative h-max min-h-full w-full">
      {groupList &&
        groupList.length > 0 &&
        groupList.map((group: IGroupByColumn) => (
          <SubGroup
            key={group.id}
            groupedIssueIds={groupedIssueIds}
            subGroupBy={subGroupBy}
            groupBy={groupBy}
            group={group}
            displayProperties={displayProperties}
            loadMoreIssues={loadMoreIssues}
            getGroupIssueCount={getGroupIssueCount}
            getPaginationData={getPaginationData}
            getIssueLoader={getIssueLoader}
            showEmptyGroup={showEmptyGroup}
            scrollableContainerRef={scrollableContainerRef}
          />
        ))}
    </div>
  );
});

interface ISubGroup {
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues;
  showEmptyGroup: boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  groupBy: TIssueGroupByOptions | undefined;
  subGroupBy: TIssueGroupByOptions | undefined;
  group: IGroupByColumn;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
  scrollableContainerRef?: MutableRefObject<HTMLDivElement | null>;
  loadMoreIssues: (groupId?: string, subGroupId?: string) => void;
}

const SubGroup: React.FC<ISubGroup> = observer((props) => {
  const {
    groupedIssueIds,
    subGroupBy,
    groupBy,
    group,
    displayProperties,
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
    showEmptyGroup,
    scrollableContainerRef,
  } = props;

  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded((prevState) => !prevState);
  };

  const visibilitySubGroupBy = (
    _list: IGroupByColumn,
    subGroupCount: number
  ): { showGroup: boolean; showIssues: boolean } => {
    const subGroupVisibility = {
      showGroup: true,
      showIssues: true,
    };
    if (showEmptyGroup) subGroupVisibility.showGroup = true;
    else {
      if (subGroupCount > 0) subGroupVisibility.showGroup = true;
      else subGroupVisibility.showGroup = false;
    }
    return subGroupVisibility;
  };

  const issueCount = getGroupIssueCount(undefined, group.id, true) ?? 0;
  const subGroupByVisibilityToggle = visibilitySubGroupBy(group, issueCount);
  if (subGroupByVisibilityToggle.showGroup === false) return <></>;

  return (
    <>
      <div className="flex flex-shrink-0 flex-col">
        <div className="sticky top-[50px] z-[3] py-1 flex w-full items-center bg-custom-background-100 border-y-[0.5px] border-custom-border-200">
          <div className="sticky left-0 flex-shrink-0">
            <HeaderSubGroupByCard
              icon={group.icon}
              title={group.name || ""}
              count={issueCount}
              isExpanded={isExpanded}
              toggleExpanded={toggleExpanded}
            />
          </div>
        </div>

        {subGroupByVisibilityToggle.showIssues && isExpanded && (
          <div className="relative">
            <KanBan
              groupedIssueIds={groupedIssueIds}
              displayProperties={displayProperties}
              subGroupBy={subGroupBy}
              groupBy={groupBy}
              subGroupId={group.id}
              showEmptyGroup={showEmptyGroup}
              scrollableContainerRef={scrollableContainerRef}
              loadMoreIssues={loadMoreIssues}
              getGroupIssueCount={getGroupIssueCount}
              getPaginationData={getPaginationData}
              getIssueLoader={getIssueLoader}
            />
          </div>
        )}
      </div>
    </>
  );
});
