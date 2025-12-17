import { useCallback, useMemo, useRef } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
// types
import type { IIssueDisplayProperties } from "@plane/types";
// components
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
// hooks
import { useIssue } from "@/hooks/store/use-issue";

import { KanBan } from "./default";

type Props = {
  anchor: string;
};
export const IssueKanbanLayoutRoot = observer(function IssueKanbanLayoutRoot(props: Props) {
  const { anchor } = props;
  // store hooks
  const { groupedIssueIds, getIssueLoader, fetchNextPublicIssues, getGroupIssueCount, getPaginationData } = useIssue();

  const displayProperties: IIssueDisplayProperties = useMemo(
    () => ({
      key: true,
      state: true,
      labels: true,
      priority: true,
      due_date: true,
    }),
    []
  );

  const fetchMoreIssues = useCallback(
    (groupId?: string, subgroupId?: string) => {
      if (getIssueLoader(groupId, subgroupId) !== "pagination") {
        fetchNextPublicIssues(anchor, groupId, subgroupId);
      }
    },
    [anchor, getIssueLoader, fetchNextPublicIssues]
  );

  const debouncedFetchMoreIssues = debounce(
    (groupId?: string, subgroupId?: string) => fetchMoreIssues(groupId, subgroupId),
    300,
    { leading: true, trailing: false }
  );

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <IssueLayoutHOC getGroupIssueCount={getGroupIssueCount} getIssueLoader={getIssueLoader}>
      <div
        className="horizontal-scrollbar scrollbar-lg relative flex size-full overflow-x-auto overflow-y-hidden"
        ref={scrollableContainerRef}
      >
        <div className="relative h-full w-max min-w-full">
          <div className="h-full w-max">
            <KanBan
              groupedIssueIds={groupedIssueIds ?? {}}
              displayProperties={displayProperties}
              subGroupBy={null}
              groupBy="state"
              showEmptyGroup
              scrollableContainerRef={scrollableContainerRef}
              loadMoreIssues={debouncedFetchMoreIssues}
              getGroupIssueCount={getGroupIssueCount}
              getPaginationData={getPaginationData}
              getIssueLoader={getIssueLoader}
            />
          </div>
        </div>
      </div>
    </IssueLayoutHOC>
  );
});
