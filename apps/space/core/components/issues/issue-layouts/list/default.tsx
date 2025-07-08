import { useRef } from "react";
import { observer } from "mobx-react";
// types
import {
  GroupByColumnTypes,
  TGroupedIssues,
  IIssueDisplayProperties,
  TIssueGroupByOptions,
  IGroupByColumn,
  TPaginationData,
  TLoader,
} from "@plane/types";
// hooks
import { useMember, useModule, useStates, useLabel, useCycle } from "@/hooks/store";
//
import { getGroupByColumns } from "../utils";
import { ListGroup } from "./list-group";

export interface IList {
  groupedIssueIds: TGroupedIssues;
  groupBy: TIssueGroupByOptions | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  showEmptyGroup?: boolean;
  loadMoreIssues: (groupId?: string) => void;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getPaginationData: (groupId: string | undefined, subGroupId: string | undefined) => TPaginationData | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
}

export const List: React.FC<IList> = observer((props) => {
  const {
    groupedIssueIds,
    groupBy,
    displayProperties,
    showEmptyGroup,
    loadMoreIssues,
    getGroupIssueCount,
    getPaginationData,
    getIssueLoader,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const member = useMember();
  const label = useLabel();
  const cycle = useCycle();
  const modules = useModule();
  const state = useStates();

  const groupList = getGroupByColumns(groupBy as GroupByColumnTypes, cycle, modules, label, state, member, true);

  if (!groupList) return null;

  return (
    <div className="relative size-full flex flex-col">
      {groupList && (
        <>
          <div
            ref={containerRef}
            className="size-full vertical-scrollbar scrollbar-lg relative overflow-auto vertical-scrollbar-margin-top-md"
          >
            {groupList.map((group: IGroupByColumn) => (
              <ListGroup
                key={group.id}
                groupIssueIds={groupedIssueIds?.[group.id]}
                groupBy={groupBy}
                group={group}
                displayProperties={displayProperties}
                showEmptyGroup={showEmptyGroup}
                loadMoreIssues={loadMoreIssues}
                getGroupIssueCount={getGroupIssueCount}
                getPaginationData={getPaginationData}
                getIssueLoader={getIssueLoader}
                containerRef={containerRef}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
