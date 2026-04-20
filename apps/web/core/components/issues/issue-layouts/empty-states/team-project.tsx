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

type TProps = {
  permissions: {
    canCreateWorkItem: (projectId: string) => boolean;
    canClearFilters: boolean;
  };
};

export const TeamProjectWorkItemEmptyState = observer(function TeamProjectWorkItemEmptyState(props: TProps) {
  const { permissions } = props;
  // router
  const { projectId: routerProjectId, teamspaceId: routerTeamspaceId } = useParams();
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  // derived values
  const teamspaceProjectWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS, projectId);

  const handleClearAllFilters = async () => {
    if (!teamspaceProjectWorkItemFilter || !teamspaceId || !projectId) return;
    await teamspaceProjectWorkItemFilter.clearFilters();
  };

  if (!teamspaceId || !projectId) return null;

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
              disabled: !permissions.canClearFilters || !teamspaceProjectWorkItemFilter,
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
              disabled: projectId ? !permissions.canCreateWorkItem(projectId) : true,
              variant: "primary",
            },
          ]}
        />
      )}
    </div>
  );
});
