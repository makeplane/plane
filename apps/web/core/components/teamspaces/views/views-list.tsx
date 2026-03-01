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
import { useTheme } from "next-themes";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// assets
import searchViewsDark from "@/app/assets/empty-state/search/views-dark.webp?url";
import searchViewsLight from "@/app/assets/empty-state/search/views-light.webp?url";
import teamsViewsDark from "@/app/assets/empty-state/teams/views-dark.webp?url";
import teamsViewsLight from "@/app/assets/empty-state/teams/views-light.webp?url";
// components
import { ListLayout } from "@/components/core/list";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
import { ViewListLoader } from "@/components/ui/loader/view-list-loader";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useTeamspaceViews } from "@/plane-web/hooks/store";
// local imports
import { TeamspaceViewListItem } from "./view-list-item";

type Props = {
  teamspaceId: string;
};

export const TeamspaceViewsList = observer(function TeamspaceViewsList(props: Props) {
  const { teamspaceId } = props;
  // plane hooks
  const { t } = useTranslation();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { toggleCreateTeamspaceViewModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { getTeamspaceViewsLoader, getTeamspaceViews, getFilteredTeamspaceViews } = useTeamspaceViews();
  // derived values
  const teamspaceViewsLoader = getTeamspaceViewsLoader(teamspaceId);
  const teamspaceViews = getTeamspaceViews(teamspaceId);
  const filteredTeamspaceViews = getFilteredTeamspaceViews(teamspaceId);
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const generalViewResolvedPath = resolvedTheme === "light" ? teamsViewsLight : teamsViewsDark;
  const filteredViewResolvedPath = resolvedTheme === "light" ? searchViewsLight : searchViewsDark;

  if (teamspaceViewsLoader === "init-loader" || !teamspaceViews || !filteredTeamspaceViews) return <ViewListLoader />;

  if (filteredTeamspaceViews.length === 0 && teamspaceViews.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <SimpleEmptyState
          title={t("teamspace_views.empty_state.filter.title")}
          description={t("teamspace_views.empty_state.filter.description")}
          assetPath={filteredViewResolvedPath}
        />
      </div>
    );
  }

  return (
    <>
      {filteredTeamspaceViews.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredTeamspaceViews.length > 0 ? (
              filteredTeamspaceViews.map((view) => (
                <TeamspaceViewListItem key={view.id} teamspaceId={teamspaceId} view={view} />
              ))
            ) : (
              <p className="mt-10 text-center text-body-xs-regular text-tertiary">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <DetailedEmptyState
          title={t("teamspace_views.empty_state.team_view.title")}
          description={t("teamspace_views.empty_state.team_view.description")}
          assetPath={generalViewResolvedPath}
          primaryButton={{
            text: t("teamspace_views.empty_state.team_view.primary_button.text"),
            onClick: () => toggleCreateTeamspaceViewModal({ isOpen: true, teamspaceId }),
            disabled: !hasWorkspaceMemberLevelPermissions,
          }}
        />
      )}
    </>
  );
});
