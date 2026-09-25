/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// assets
import AllFiltersImage from "@/app/assets/empty-state/cycle/all-filters.svg?url";
import NameFilterImage from "@/app/assets/empty-state/cycle/name-filter.svg?url";
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
  // derived values
  const filteredArchivedCycleIds = getFilteredArchivedCycleIds(projectId);

  if (loader || !filteredArchivedCycleIds) return <CycleModuleListLayoutLoader />;

  if (filteredArchivedCycleIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <img
            src={archivedCyclesSearchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching cycles"
          />
          <h5 className="mt-7 mb-1 text-18 font-medium">No matching cycles</h5>
          <p className="text-14 text-placeholder">
            {archivedCyclesSearchQuery.trim() === ""
              ? "Remove the filters to see all cycles"
              : "Remove the search criteria to see all cycles"}
          </p>
        </div>
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
