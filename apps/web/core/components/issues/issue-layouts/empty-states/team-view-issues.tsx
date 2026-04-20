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
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

type TProps = {
  permissions: {
    canCreateWorkItem: (projectId: string) => boolean;
    canClearFilters: boolean;
  };
};

export const TeamViewEmptyState = observer(function TeamViewEmptyState(props: TProps) {
  const { permissions } = props;
  // router
  const { teamspaceId: routerTeamspaceId, viewId: routerViewId } = useParams();
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const viewId = routerViewId ? routerViewId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { getTeamspaceProjectIds } = useTeamspaces();
  // derived values
  const teamspaceViewWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.TEAM_VIEW, viewId);
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId) : [];
  const firstProjectId = teamspaceProjectIds?.[0];

  const handleClearAllFilters = async () => {
    if (!teamspaceViewWorkItemFilter || !teamspaceId || !viewId) return;
    await teamspaceViewWorkItemFilter.clearFilters();
  };

  if (!teamspaceId || !viewId) return null;
  return (
    <div className="relative h-full w-full overflow-y-auto">
      {teamspaceViewWorkItemFilter?.hasActiveFilters ? (
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
              disabled: !permissions.canClearFilters || !teamspaceViewWorkItemFilter,
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
                toggleCreateIssueModal(true, EIssuesStoreType.TEAM_VIEW, teamspaceProjectIds);
              },
              disabled: firstProjectId ? !permissions.canCreateWorkItem(firstProjectId) : true,
              variant: "primary",
            },
          ]}
        />
      )}
    </div>
  );
});
