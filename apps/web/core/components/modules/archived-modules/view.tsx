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
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// components
import { ModuleListItem, ModulePeekOverview } from "@/components/modules";
// ui
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useModuleFilter } from "@/hooks/store/use-module-filter";

export interface IArchivedModulesView {
  workspaceSlug: string;
  projectId: string;
}

export const ArchivedModulesView = observer(function ArchivedModulesView(props: IArchivedModulesView) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  // store hooks
  const { getFilteredArchivedModuleIds, loader } = useModule();
  const { archivedModulesSearchQuery, currentProjectArchivedFilters } = useModuleFilter();
  // derived values
  const filteredArchivedModuleIds = getFilteredArchivedModuleIds(projectId);
  const hasSearchQuery = archivedModulesSearchQuery.trim() !== "";
  const hasAppliedFilters = Object.values(currentProjectArchivedFilters ?? {}).some((filterValues) =>
    filterValues ? filterValues.length > 0 : false
  );

  if (loader || !filteredArchivedModuleIds) return <CycleModuleListLayoutLoader />;

  if (filteredArchivedModuleIds.length === 0)
    return (
      <EmptyStateDetailed
        assetKey="search"
        title={t("common_empty_state.search.title")}
        description={
          hasSearchQuery || hasAppliedFilters
            ? t("common_empty_state.search.description")
            : t("workspace_empty_state.archive_modules.description")
        }
      />
    );

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
          {filteredArchivedModuleIds.map((moduleId) => (
            <ModuleListItem key={moduleId} moduleId={moduleId} />
          ))}
        </div>
        <ModulePeekOverview
          projectId={projectId?.toString() ?? ""}
          workspaceSlug={workspaceSlug?.toString() ?? ""}
          isArchived
        />
      </div>
    </div>
  );
});
