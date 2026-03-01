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
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";

export const ProjectArchivedEpicsEmptyState = observer(function ProjectArchivedEpicsEmptyState() {
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const archivedWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.ARCHIVED_EPIC, projectId);
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {archivedWorkItemFilter?.hasActiveFilters ? (
        <EmptyStateDetailed
          assetKey="search"
          title={t("common_empty_state.search.title")}
          description={t("common_empty_state.search.description")}
          actions={[
            {
              label: "Clear filters",
              onClick: archivedWorkItemFilter?.clearFilters,
              disabled: !canPerformEmptyStateActions || !archivedWorkItemFilter,
              variant: "secondary",
            },
          ]}
        />
      ) : (
        <EmptyStateDetailed
          assetKey="archived-work-item"
          title={t("workspace_empty_state.archive_epics.title")}
          description={t("workspace_empty_state.archive_epics.description")}
        />
      )}
    </div>
  );
});
