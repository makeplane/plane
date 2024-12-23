"use client";

import { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssueFilterType, EIssuesStoreType } from "@plane/constants";
// types
import { IIssueFilterOptions, IProjectView } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { AppliedFiltersList } from "@/components/issues";
import { getAreFiltersEqual } from "@/components/issues/issue-layouts/utils";
import { UpdateViewComponent } from "@/components/views/update-view-component";
// constants
import { EViewAccess } from "@/constants/views";
// hooks
import { useIssues, useLabel, useUser, useUserPermissions } from "@/hooks/store";
import { CreateUpdateTeamViewModal } from "@/plane-web/components/teams/views/modals/create-update";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { useTeamViews } from "@/plane-web/hooks/store";

export const TeamViewAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamId, viewId } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { workspaceLabels } = useLabel();
  const { getViewById, updateView } = useTeamViews();
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const viewDetails = teamId && viewId ? getViewById(teamId.toString(), viewId.toString()) : null;
  const userFilters = issueFilters?.filters;

  // filters whose value not null or empty array
  let appliedFilters: IIssueFilterOptions | undefined = undefined;
  Object.entries(userFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (!appliedFilters) appliedFilters = {};
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  // handlers
  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!workspaceSlug || !teamId || !viewId) return;
    if (!value) {
      updateFilters(
        workspaceSlug.toString(),
        teamId.toString(),
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
      teamId.toString(),
      EIssueFilterType.FILTERS,
      {
        [key]: newValues,
      },
      viewId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !teamId || !viewId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(
      workspaceSlug.toString(),
      teamId.toString(),
      EIssueFilterType.FILTERS,
      { ...newFilters },
      viewId.toString()
    );
  };

  // add a placeholder object instead of appliedFilters if it is undefined
  const areFiltersEqual = getAreFiltersEqual(appliedFilters ?? {}, issueFilters, viewDetails as IProjectView);
  const viewFilters = {
    filters: cloneDeep(appliedFilters ?? {}),
    display_filters: cloneDeep(issueFilters?.displayFilters),
    display_properties: cloneDeep(issueFilters?.displayProperties),
  };
  // return if no filters are applied
  if (isEmpty(appliedFilters) && areFiltersEqual) return null;

  const handleUpdateView = () => {
    if (!workspaceSlug || !teamId || !viewId || !viewDetails) return;

    updateView(workspaceSlug.toString(), teamId.toString(), viewId.toString(), viewFilters);
  };

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isLocked = !!viewDetails?.is_locked;
  const isOwner = viewDetails?.owned_by === data?.id;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <CreateUpdateTeamViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug.toString()}
        teamId={teamId.toString()}
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
          labels={workspaceLabels ?? []}
          disableEditing={isLocked}
          alwaysAllowEditing={!isLocked}
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
