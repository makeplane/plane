import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetView } from "components/core";
import { AppliedFiltersList } from "components/issues";
// types
import { IIssueFilterOptions, TStaticIssueTypes } from "types";
// fetch-keys
import { GLOBAL_VIEW_ISSUES } from "constants/fetch-keys";
import { PrimaryButton } from "components/ui";

type Props = {
  type?: TStaticIssueTypes;
};

export const GlobalViewsAllLayouts: React.FC<Props> = observer((props) => {
  const { type } = props;

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const {
    globalViews: globalViewsStore,
    globalViewIssues: globalViewIssuesStore,
    workspaceFilter: workspaceFilterStore,
    workspace: workspaceStore,
    project: projectStore,
  } = useMobxStore();

  const viewDetails = globalViewId ? globalViewsStore.globalViewDetails[globalViewId.toString()] : undefined;

  useSWR(
    workspaceSlug && globalViewId && viewDetails ? GLOBAL_VIEW_ISSUES(globalViewId.toString()) : null,
    workspaceSlug && globalViewId && viewDetails
      ? () => {
          globalViewIssuesStore.fetchViewIssues(
            workspaceSlug.toString(),
            globalViewId.toString(),
            viewDetails?.query_data.filters
          );
        }
      : null
  );

  useSWR(
    workspaceSlug && type ? GLOBAL_VIEW_ISSUES(type) : null,
    workspaceSlug && type
      ? () => {
          globalViewIssuesStore.fetchStaticIssues(workspaceSlug.toString(), type);
        }
      : null
  );

  // const areFiltersDifferent = (filtersSet1: IIssueFilterOptions, filtersSet2: IIssueFilterOptions): boolean => {
  //   if (Object.keys(filtersSet1).length !== Object.keys(filtersSet2).length) return true;

  //   for (const [key, value] of Object.entries(filtersSet1) as [keyof IIssueFilterOptions, string[] | null][]) {
  //     if (value) {
  //       if (value !== filtersSet2[key]) return true;

  //       if (value?.length !== filtersSet2[key]?.length) return true;

  //       for (let i = 0; i < value.length; i++) {
  //         if (!filtersSet2[key]?.includes(value[i])) return true;
  //       }
  //     }
  //   }

  //   return false;
  // };

  const issues = type
    ? globalViewIssuesStore.viewIssues?.[type]
    : globalViewId
    ? globalViewIssuesStore.viewIssues?.[globalViewId.toString()]
    : undefined;

  return (
    <div className="relative w-full h-full flex flex-col overflow-auto">
      {viewDetails?.query_data && (
        <div className="flex items-start justify-between gap-4 p-4">
          <AppliedFiltersList
            appliedFilters={viewDetails.query_data.filters ?? {}}
            handleClearAllFilters={() => {}}
            handleRemoveFilter={() => {}}
            labels={workspaceStore.workspaceLabels ?? undefined}
            members={workspaceStore.workspaceMembers?.map((m) => m.member)}
            projects={workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined}
          />
          {/* {areFiltersDifferent(appliedFilters, viewDetails.query_data.filters ?? {}) && (
            <PrimaryButton className="whitespace-nowrap">Update view</PrimaryButton>
          )} */}
        </div>
      )}
      <div className="h-full w-full">
        <SpreadsheetView
          displayProperties={workspaceFilterStore.workspaceDisplayProperties}
          displayFilters={workspaceFilterStore.workspaceDisplayFilters}
          handleDisplayFilterUpdate={() => {}}
          issues={issues}
          handleIssueAction={() => {}}
          handleUpdateIssue={() => {}}
          disableUserActions={false}
        />
      </div>
    </div>
  );
});
