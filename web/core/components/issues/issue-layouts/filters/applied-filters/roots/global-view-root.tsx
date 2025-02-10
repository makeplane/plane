"use client";

import { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import {
  DEFAULT_GLOBAL_VIEWS_LIST,
  EIssueFilterType,
  EIssuesStoreType,
  EViewAccess,
  GLOBAL_VIEW_UPDATED,
 EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { IIssueFilterOptions, TStaticViewTypes } from "@plane/types";
//ui
// components
import { Header, EHeaderVariant, Loader } from "@plane/ui";
import { AppliedFiltersList } from "@/components/issues";
import { UpdateViewComponent } from "@/components/views/update-view-component";
import { CreateUpdateWorkspaceViewModal } from "@/components/workspace";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEventTracker, useGlobalView, useIssues, useLabel, useUser, useUserPermissions } from "@/hooks/store";
import { getAreFiltersEqual } from "../../../utils";

type Props = {
  globalViewId: string;
  isLoading?: boolean;
};

export const GlobalViewsAppliedFiltersRoot = observer((props: Props) => {
  const { globalViewId, isLoading = false } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    issuesFilter: { filters, updateFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { workspaceLabels } = useLabel();
  const { globalViewMap, updateGlobalView } = useGlobalView();
  const { captureEvent } = useEventTracker();
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // derived values
  const issueFilters = filters?.[globalViewId];
  const userFilters = issueFilters?.filters;
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

  const viewFilters = {
    filters: cloneDeep(appliedFilters ?? {}),
    display_filters: cloneDeep(issueFilters?.displayFilters),
    display_properties: cloneDeep(issueFilters?.displayProperties),
  };
  const handleUpdateView = () => {
    if (!workspaceSlug || !globalViewId) return;

    updateGlobalView(workspaceSlug.toString(), globalViewId.toString(), viewFilters).then((res) => {
      if (res)
        captureEvent(GLOBAL_VIEW_UPDATED, {
          view_id: res.id,
          applied_filters: res.filters,
          state: "SUCCESS",
          element: "Spreadsheet view",
        });
    });
  };

  // add a placeholder object instead of appliedFilters if it is undefined
  const areFiltersEqual = getAreFiltersEqual(appliedFilters ?? {}, issueFilters, viewDetails);

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isDefaultView = DEFAULT_GLOBAL_VIEWS_LIST.map((view) => view.key).includes(globalViewId as TStaticViewTypes);

  const isLocked = viewDetails?.is_locked;
  const isOwner = viewDetails?.owned_by === data?.id;
  const areAppliedFiltersEmpty = isEmpty(appliedFilters);

  // return if no filters are applied

  if (areAppliedFiltersEmpty && areFiltersEqual) return null;

  return (
    <Header
      variant={EHeaderVariant.TERNARY}
      className={cn({
        "justify-end": areAppliedFiltersEmpty,
      })}
    >
      <CreateUpdateWorkspaceViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preLoadedData={{
          name: `${viewDetails?.name} 2`,
          description: viewDetails?.description,
          access: viewDetails?.access ?? EViewAccess.PUBLIC,
          ...viewFilters,
        }}
      />

      {isLoading ? (
        <Loader className="flex flex-wrap items-stretch gap-2 bg-custom-background-100 truncate my-auto">
          <Loader.Item height="36px" width="150px" />
          <Loader.Item height="36px" width="100px" />
          <Loader.Item height="36px" width="300px" />
        </Loader>
      ) : (
        <AppliedFiltersList
          labels={workspaceLabels ?? undefined}
          appliedFilters={appliedFilters ?? {}}
          handleClearAllFilters={handleClearAllFilters}
          handleRemoveFilter={handleRemoveFilter}
          disableEditing={isLocked}
          alwaysAllowEditing
        />
      )}

      {!isDefaultView ? (
        <UpdateViewComponent
          isLocked={isLocked}
          areFiltersEqual={!!areFiltersEqual}
          isOwner={isOwner}
          isAuthorizedUser={isAuthorizedUser}
          setIsModalOpen={setIsModalOpen}
          handleUpdateView={handleUpdateView}
        />
      ) : (
        <></>
      )}
    </Header>
  );
});
