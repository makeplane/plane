/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
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
// plane-web imports
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";

export const ProjectEpicsEmptyState = observer(function ProjectEpicsEmptyState() {
  // router
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // states
  const [isCreateEpicModalOpen, setIsCreateEpicModalOpen] = useState(false);
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const epicsFilter = useWorkItemFilterInstance(EIssuesStoreType.EPIC, projectId);

  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <CreateUpdateEpicModal
        isOpen={isCreateEpicModalOpen}
        onClose={() => setIsCreateEpicModalOpen(false)}
        data={{ project_id: projectId }}
      />
      {epicsFilter?.hasActiveFilters ? (
        <EmptyStateDetailed
          assetKey="search"
          title={t("common_empty_state.search.title")}
          description={t("common_empty_state.search.description")}
          actions={[
            {
              label: t("project_issues.empty_state.issues_empty_filter.secondary_button.text"),
              onClick: epicsFilter?.clearFilters,
              disabled: !canPerformEmptyStateActions || !epicsFilter,
              variant: "secondary",
            },
          ]}
        />
      ) : (
        <EmptyStateDetailed
          assetKey="epic"
          title={t("project_empty_state.epics.title")}
          description={t("project_empty_state.epics.description")}
          actions={[
            {
              label: t("project_empty_state.epics.cta_primary"),
              onClick: () => setIsCreateEpicModalOpen(true),
              disabled: !canPerformEmptyStateActions,
              variant: "primary",
            },
          ]}
        />
      )}
    </div>
  );
});
