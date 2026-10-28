/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
// components
import { CyclesList } from "@/components/cycles/list";
// ui
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";

export interface IArchivedCyclesView {
  workspaceSlug: string;
  projectId: string;
}

export const ArchivedCyclesView = observer(function ArchivedCyclesView(props: IArchivedCyclesView) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getFilteredArchivedCycleIds, loader } = useCycle();
  const { archivedCyclesSearchQuery } = useCycleFilter();
  const { t } = useTranslation();
  // derived values
  const filteredArchivedCycleIds = getFilteredArchivedCycleIds(projectId);

  if (loader || !filteredArchivedCycleIds) return <CycleModuleListLayoutLoader />;

  if (filteredArchivedCycleIds.length === 0)
    return (
      <div className="vertical-scrollbar scrollbar-lg grid h-full w-full place-items-center overflow-y-auto">
        <EmptyStateCompact
          assetKey="search-compact"
          title={t("project_cycles.no_matching_cycles")}
          description={
            archivedCyclesSearchQuery.trim() === ""
              ? t("project_cycles.remove_filters_to_see_all_cycles")
              : t("project_cycles.remove_search_criteria_to_see_all_cycles")
          }
          rootClassName="h-auto py-10"
        />
      </div>
    );

  return (
    <CyclesList
      completedCycleIds={[]}
      cycleIds={filteredArchivedCycleIds}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      isArchived
    />
  );
});
