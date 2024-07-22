"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
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
import SomethingWentWrongImage from "public/something-went-wrong.svg";

type Props = {
  peekId: string | undefined;
  publishSettings: PublishStore;
};

export const IssuesLayoutsRoot: FC<Props> = observer((props) => {
  const { peekId, publishSettings } = props;
  // store hooks
  const { getIssueFilters } = useIssueFilter();
  const { loader, groupedIssueIds, fetchPublicIssues } = useIssue();
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

  return (
    <div className="relative h-full w-full overflow-hidden">
      {peekId && <IssuePeekOverview anchor={anchor} peekId={peekId} />}

      {loader && !groupedIssueIds ? (
        <div className="py-10 text-center text-sm text-custom-text-100">Loading...</div>
      ) : (
        <>
          {error ? (
            <div className="grid h-full w-full place-items-center p-6">
              <div className="text-center">
                <div className="mx-auto grid h-52 w-52 place-items-center rounded-full bg-custom-background-80">
                  <div className="grid h-32 w-32 place-items-center">
                    <Image src={SomethingWentWrongImage} alt="Oops! Something went wrong" />
                  </div>
                </div>
                <h1 className="mt-12 text-3xl font-semibold">Oops! Something went wrong.</h1>
                <p className="mt-4 text-custom-text-300">The public board does not exist. Please check the URL.</p>
              </div>
            </div>
          ) : (
            activeLayout && (
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
            )
          )}
        </>
      )}
    </div>
  );
});
