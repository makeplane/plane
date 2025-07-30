"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { IssueKanbanLayoutRoot, IssuesListLayoutRoot } from "@/components/issues";
import { IssueAppliedFilters } from "@/components/issues/filters/applied-filters/root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useIssue, useIssueDetails, useIssueFilter } from "@/hooks/store";
// store
import { PublishStore } from "@/store/publish/publish.store";
// assets
import { SomethingWentWrongError } from "./error";

type Props = {
  peekId: string | undefined;
  publishSettings: PublishStore;
};

export const IssuesLayoutsRoot: FC<Props> = observer((props) => {
  const { peekId, publishSettings } = props;
  // store hooks
  const { getIssueFilters } = useIssueFilter();
  const { fetchPublicIssues } = useIssue();
  const issueDetailStore = useIssueDetails();
  // derived values
  const { anchor } = publishSettings;
  const issueFilters = anchor ? getIssueFilters(anchor) : undefined;
  // derived values
  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  const { error } = useSWR(
    anchor ? `PUBLIC_ISSUES_${anchor}` : null,
    anchor
      ? () => fetchPublicIssues(anchor, "init-loader", { groupedBy: "state", canGroup: true, perPageCount: 50 })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (peekId) {
      issueDetailStore.setPeekId(peekId.toString());
    }
  }, [peekId, issueDetailStore]);

  if (!anchor) return null;

  if (error) return <SomethingWentWrongError />;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {peekId && <IssuePeekOverview anchor={anchor} peekId={peekId} />}
      {activeLayout && (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
          {/* applied filters */}
          <IssueAppliedFilters anchor={anchor} />

          {activeLayout === "list" && (
            <div className="relative h-full w-full overflow-y-auto">
              <IssuesListLayoutRoot anchor={anchor} />
            </div>
          )}
          {activeLayout === "kanban" && (
            <div className="relative mx-auto h-full w-full p-5">
              <IssueKanbanLayoutRoot anchor={anchor} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
