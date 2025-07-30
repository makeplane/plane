"use client";

import { useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssueFilterType, EUserPermissionsLevel, TEAMSPACE_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType, EUserWorkspaceRoles, EViewAccess, IIssueFilterOptions, IProjectView } from "@plane/types";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { AppliedFiltersList } from "@/components/issues";
import { getAreFiltersEqual } from "@/components/issues/issue-layouts/utils";
import { UpdateViewComponent } from "@/components/views/update-view-component";
// hooks
import { useIssues, useLabel, useUser, useUserPermissions } from "@/hooks/store";
// plane web imports
import { CreateUpdateTeamspaceViewModal } from "@/plane-web/components/teamspaces/views/modals/create-update";
import { useTeamspaceViews } from "@/plane-web/hooks/store";

export const TeamspaceViewAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug, teamspaceId, viewId } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { workspaceLabels } = useLabel();
  const { getViewById, updateView } = useTeamspaceViews();
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const viewDetails = teamspaceId && viewId ? getViewById(teamspaceId.toString(), viewId.toString()) : null;
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
    if (!workspaceSlug || !teamspaceId || !viewId) return;
    if (!value) {
      updateFilters(
        workspaceSlug.toString(),
        teamspaceId.toString(),
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
      teamspaceId.toString(),
      EIssueFilterType.FILTERS,
      {
        [key]: newValues,
      },
      viewId.toString()
    );
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !teamspaceId || !viewId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = [];
    });
    updateFilters(
      workspaceSlug.toString(),
      teamspaceId.toString(),
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
    if (!workspaceSlug || !teamspaceId || !viewId || !viewDetails) return;

    updateView(workspaceSlug.toString(), teamspaceId.toString(), viewId.toString(), viewFilters);
  };

  const isAuthorizedUser = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isLocked = !!viewDetails?.is_locked;
  const isOwner = viewDetails?.owned_by === data?.id;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <CreateUpdateTeamspaceViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug.toString()}
        teamspaceId={teamspaceId.toString()}
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
          trackerElement={TEAMSPACE_VIEW_TRACKER_ELEMENTS.HEADER_SAVE_VIEW_BUTTON}
        />
      </Header.RightItem>
    </Header>
  );
});
