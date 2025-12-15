import { useRef } from "react";
import { observer } from "mobx-react";
// types
import type {
  GroupByColumnTypes,
  TGroupedIssues,
  IIssueDisplayProperties,
  TIssueGroupByOptions,
  TPaginationData,
  TLoader,
} from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useStates } from "@/hooks/store/use-state";
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
  getIssueLoader: (groupId?: string, subGroupId?: string) => TLoader;
}

export const List = observer(function List(props: IList) {
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
            {groupList.map((group) => (
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
