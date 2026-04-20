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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// components
import { ExistingIssuesListModal } from "@/components/core/modals/existing-issues-list-modal";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkItemFilterInstance } from "@/hooks/store/work-item-filters/use-work-item-filter-instance";

type TProps = {
  workspaceSlug: string;
  permissions: {
    canCreateWorkItem: (projectId: string) => boolean;
    canAddWorkItemsToModule: (projectId: string, moduleId: string) => boolean;
    canClearFilters: boolean;
  };
};

export const ModuleEmptyState = observer(function ModuleEmptyState(props: TProps) {
  const { workspaceSlug, permissions } = props;
  // router
  const { moduleId: routerModuleId, projectId: routerProjectId } = useParams();
  const moduleId = routerModuleId ? routerModuleId.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { issues } = useIssues(EIssuesStoreType.MODULE);
  const { toggleCreateIssueModal } = useCommandPalette();
  // derived values
  const moduleWorkItemFilter = useWorkItemFilterInstance(EIssuesStoreType.MODULE, moduleId);

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);
    await issues
      .addIssuesToModule(workspaceSlug.toString(), projectId?.toString(), moduleId.toString(), issueIds)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Work items added to the module successfully.",
        })
      )
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Selected work items could not be added to the module. Please try again.",
        })
      );
  };

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug?.toString()}
        projectId={projectId?.toString()}
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        searchParams={{ module: moduleId != undefined ? moduleId.toString() : "" }}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <div className="grid h-full w-full place-items-center">
        {moduleWorkItemFilter?.hasActiveFilters ? (
          <EmptyStateDetailed
            assetKey="search"
            title={t("common_empty_state.search.title")}
            description={t("common_empty_state.search.description")}
            actions={[
              {
                label: "Clear filters",
                onClick: moduleWorkItemFilter?.clearFilters,
                disabled: !permissions.canClearFilters || !moduleWorkItemFilter,
                variant: "secondary",
              },
            ]}
          />
        ) : (
          <EmptyStateDetailed
            assetKey="work-item"
            title={t("project_empty_state.module_work_items.title")}
            description={t("project_empty_state.module_work_items.description")}
            actions={[
              {
                label: t("project_empty_state.module_work_items.cta_primary"),
                onClick: () => {
                  toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                },
                disabled: projectId ? !permissions.canCreateWorkItem(projectId) : true,
                variant: "primary",
              },
              {
                label: t("project_empty_state.module_work_items.cta_secondary"),
                onClick: () => setModuleIssuesListModal(true),
                disabled: projectId && moduleId ? !permissions.canAddWorkItemsToModule(projectId, moduleId) : true,
                variant: "secondary",
              },
            ]}
          />
        )}
      </div>
    </div>
  );
});
