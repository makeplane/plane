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
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType, EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";

export const TeamProjectWorkItemEmptyState = observer(function TeamProjectWorkItemEmptyState() {
  // router
  const {
    workspaceSlug: routerWorkspaceSlug,
    projectId: routerProjectId,
    teamspaceId: routerTeamspaceId,
  } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const teamspaceProjectWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS, projectId);
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleClearAllFilters = async () => {
    if (!teamspaceProjectWorkItemFilter || !teamspaceId || !projectId) return;
    await teamspaceProjectWorkItemFilter.clearFilters();
  };

  if (!workspaceSlug || !teamspaceId || !projectId) return null;

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {teamspaceProjectWorkItemFilter?.hasActiveFilters ? (
        <EmptyStateDetailed
          assetKey="search"
          title={t("teamspace_work_items.empty_state.work_items_empty_filter.title")}
          description={t("teamspace_work_items.empty_state.work_items_empty_filter.description")}
          actions={[
            {
              label: t("teamspace_work_items.empty_state.work_items_empty_filter.secondary_button.text"),
              onClick: () => {
                handleClearAllFilters();
              },
              disabled: !hasWorkspaceMemberLevelPermissions || !teamspaceProjectWorkItemFilter,
              variant: "secondary",
            },
          ]}
        />
      ) : (
        <EmptyStateDetailed
          assetKey="work-item"
          title={t("teamspace_work_items.empty_state.no_work_items.title")}
          description={t("teamspace_work_items.empty_state.no_work_items.description")}
          actions={[
            {
              label: t("teamspace_work_items.empty_state.no_work_items.primary_button.text"),
              onClick: () => {
                toggleCreateIssueModal(true, EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS, [projectId]);
              },
              disabled: !hasWorkspaceMemberLevelPermissions,
              variant: "primary",
            },
          ]}
        />
      )}
    </div>
  );
});
