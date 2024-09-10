"use client";

import { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IIssueFilterOptions } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { AppliedFiltersList } from "@/components/issues";
import { CreateUpdateProjectViewModal } from "@/components/views";
import { UpdateViewComponent } from "@/components/views/update-view-component";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { EViewAccess } from "@/constants/views";
// hooks
import { useIssues, useLabel, useProjectState, useProjectView, useUser, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { getAreFiltersEqual } from "../../../utils";

export const ProjectViewAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId, viewId } = useParams();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { projectLabels } = useLabel();
  const { projectStates } = useProjectState();
  const { viewMap, updateView } = useProjectView();
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // derived values
  const viewDetails = viewId ? viewMap[viewId.toString()] : null;
  const userFilters = issueFilters?.filters;
  // filters whose value not null or empty array
  let appliedFilters: IIssueFilterOptions | undefined = undefined;
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (!appliedFilters) appliedFilters = {};
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !projectId || !viewId) return;
    if (!value) {
      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        {
          [key]: null,
        },
        viewId.toString()
      );
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      {
        [key]: newValues,
      },
      viewId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId || !viewId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(
      workspaceSlug.toString(),
      projectId.toString(),
      EIssueFilterType.FILTERS,
      { ...newFilters },
      viewId.toString()
    );
  };

  // add a placeholder object instead of appliedFilters if it is undefined
  const areFiltersEqual = getAreFiltersEqual(appliedFilters ?? {}, issueFilters, viewDetails);
  const viewFilters = {
    filters: cloneDeep(appliedFilters ?? {}),
    display_filters: cloneDeep(issueFilters?.displayFilters),
    display_properties: cloneDeep(issueFilters?.displayProperties),
  };
  // return if no filters are applied
  if (isEmpty(appliedFilters) && areFiltersEqual) return null;

  const handleUpdateView = () => {
    if (!workspaceSlug || !projectId || !viewId || !viewDetails) return;

    updateView(workspaceSlug.toString(), projectId.toString(), viewId.toString(), viewFilters);
  };

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isLocked = !!viewDetails?.is_locked;
  const isOwner = viewDetails?.owned_by === data?.id;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <CreateUpdateProjectViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        preLoadedData={{
          name: `${viewDetails?.name} 2`,
          description: viewDetails?.description,
          logo_props: viewDetails?.logo_props,
          access: viewDetails?.access ?? EViewAccess.PUBLIC,
          ...viewFilters,
        }}
      />
      <Header.LeftItem className="w-[70%]">
        <AppliedFiltersList
          appliedFilters={appliedFilters ?? {}}
          handleClearAllFilters={handleClearAllFilters}
          handleRemoveFilter={handleRemoveFilter}
          labels={projectLabels ?? []}
          states={projectStates}
          disableEditing={isLocked}
        />
      </Header.LeftItem>
      <Header.RightItem>
        <UpdateViewComponent
          isLocked={isLocked}
          areFiltersEqual={!!areFiltersEqual}
          isOwner={isOwner}
          isAuthorizedUser={isAuthorizedUser}
          setIsModalOpen={setIsModalOpen}
          handleUpdateView={handleUpdateView}
        />
      </Header.RightItem>
    </Header>
  );
});
