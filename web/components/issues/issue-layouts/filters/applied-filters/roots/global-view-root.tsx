import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IIssueFilterOptions, TStaticViewTypes } from "@plane/types";
// hooks
//ui
import { Button } from "@plane/ui";
// components
import { AppliedFiltersList } from "@/components/issues";
// types
import { GLOBAL_VIEW_UPDATED } from "@/constants/event-tracker";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { DEFAULT_GLOBAL_VIEWS_LIST, EUserWorkspaceRoles } from "@/constants/workspace";
// constants
import { useEventTracker, useGlobalView, useIssues, useLabel, useUser } from "@/hooks/store";

type Props = {
  globalViewId: string;
};

export const GlobalViewsAppliedFiltersRoot = observer((props: Props) => {
  const { globalViewId } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    issuesFilter: { filters, updateFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { workspaceLabels } = useLabel();
  const { globalViewMap, updateGlobalView } = useGlobalView();
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  // derived values
  const userFilters = filters?.[globalViewId]?.filters;
  const viewDetails = globalViewMap[globalViewId];

  // filters whose value not null or empty array
  let appliedFilters: IIssueFilterOptions | undefined = undefined;
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (!appliedFilters) appliedFilters = {};
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !globalViewId) return;

    if (!value) {
      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.FILTERS,
        { [key]: null },
        globalViewId.toString()
      );
      return;
    }

    let newValues = userFilters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);
    updateFilters(
      workspaceSlug.toString(),
      undefined,
      EIssueFilterType.FILTERS,
      { [key]: newValues },
      globalViewId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !globalViewId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(
      workspaceSlug.toString(),
      undefined,
      EIssueFilterType.FILTERS,
      { ...newFilters },
      globalViewId.toString()
    );
  };

  const handleUpdateView = () => {
    if (!workspaceSlug || !globalViewId) return;

    updateGlobalView(workspaceSlug.toString(), globalViewId.toString(), {
      filters: {
        ...(appliedFilters ?? {}),
      },
    }).then((res) => {
      if (res)
        captureEvent(GLOBAL_VIEW_UPDATED, {
          view_id: res.id,
          applied_filters: res.filters,
          state: "SUCCESS",
          element: "Spreadsheet view",
        });
    });
  };

  const areFiltersEqual = isEqual(appliedFilters ?? {}, viewDetails?.filters ?? {});

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  const isDefaultView = DEFAULT_GLOBAL_VIEWS_LIST.map((view) => view.key).includes(globalViewId as TStaticViewTypes);

  // return if no filters are applied

  if (isEmpty(appliedFilters) && areFiltersEqual) return null;

  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <AppliedFiltersList
        labels={workspaceLabels ?? undefined}
        appliedFilters={appliedFilters ?? {}}
        handleClearAllFilters={handleClearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        alwaysAllowEditing
      />

      {!isDefaultView && !areFiltersEqual && isAuthorizedUser && (
        <>
          <div />
          <Button variant="primary" onClick={handleUpdateView}>
            Update view
          </Button>
        </>
      )}
    </div>
  );
});
