/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { useTheme } from "next-themes";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserWorkspaceRoles } from "@plane/types";
// assets
import allFiltersDark from "@/app/assets/empty-state/project/all-filters-dark.svg?url";
import allFiltersLight from "@/app/assets/empty-state/project/all-filters-light.svg?url";
import nameFilterDark from "@/app/assets/empty-state/project/name-filter-dark.svg?url";
import nameFilterLight from "@/app/assets/empty-state/project/name-filter-light.svg?url";
// components
import { ListLayout } from "@/components/core/list/list-root";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// plane web hooks
import { useTeamspaces, useTeamspaceFilter } from "@/plane-web/hooks/store";
// components
import { TeamsLoader } from "./loader";
import { TeamspaceListItem } from "./teamspace-list-item";

type TTeamspacesListProps = {
  isEditingAllowed: boolean;
};

export const TeamspacesList = observer(function TeamspacesList(props: TTeamspacesListProps) {
  const { isEditingAllowed } = props;
  // plane hooks
  const { t } = useTranslation();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // plane web hooks
  const { allTeamSpaceIds, filteredTeamSpaceIds, loader } = useTeamspaces();
  const { searchQuery } = useTeamspaceFilter();
  // derived values
  const hasWorkspaceAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE
  );
  const resolvedAllFiltersImage = resolvedTheme === "light" ? allFiltersLight : allFiltersDark;
  const resolvedNameFilterImage = resolvedTheme === "light" ? nameFilterLight : nameFilterDark;

  if (!allTeamSpaceIds || loader === "init-loader") return <TeamsLoader />;

  if (allTeamSpaceIds?.length === 0)
    return (
      <EmptyStateDetailed
        assetKey="teamspace"
        title={t("workspace_empty_state.teamspaces.title")}
        description={t("workspace_empty_state.teamspaces.description")}
        actions={[
          {
            label: t("workspace_empty_state.teamspaces.cta_primary"),
            onClick: () => {
              toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined });
            },
            disabled: !hasWorkspaceAdminLevelPermissions,
          },
        ]}
      />
    );

  if (filteredTeamSpaceIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <img
            src={searchQuery.trim() === "" ? resolvedAllFiltersImage : resolvedNameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching teamspace"
          />
          <h5 className="mb-1 mt-7 text-h5-medium">No matching teamspace</h5>
          <p className="whitespace-pre-line text-body-sm-regular text-placeholder">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all teamspaces"
              : "No teamspace detected with the matching criteria.\nCreate a new teamspace instead"}
          </p>
        </div>
      </div>
    );

  return (
    <ListLayout>
      {filteredTeamSpaceIds.map((teamspaceId) => (
        <TeamspaceListItem key={teamspaceId} teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
      ))}
    </ListLayout>
  );
});
