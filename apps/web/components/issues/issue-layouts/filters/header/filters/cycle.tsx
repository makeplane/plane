/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CycleGroupIcon } from "@plane/blocks/icons";
import type { TCycleGroups } from "@plane/types";
// components
import { FilterSubmenu } from "@/components/common/filters/filter-submenu";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
};

const getCycleStatus = (status: TCycleGroups | undefined) =>
  (status ? status.toLocaleLowerCase() : "draft") as TCycleGroups;

export const FilterCycle = observer(function FilterCycle(props: Props) {
  const { appliedFilters, handleUpdate } = props;
  // router
  const { projectId } = useParams();
  // store hooks
  const { getCycleById, getProjectCycleIds } = useCycle();
  // derived values
  const cycleIds = projectId ? getProjectCycleIds(projectId.toString()) : undefined;
  const options = (cycleIds ?? []).flatMap((cycleId) => {
    const cycle = getCycleById(cycleId);
    if (!cycle) return [];
    return [
      {
        value: cycle.id,
        label: cycle.name,
        icon: <CycleGroupIcon cycleGroup={getCycleStatus(cycle.status)} className="h-3.5 w-3.5 flex-shrink-0" />,
        trailing:
          getCycleStatus(cycle.status) === "current" ? (
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent-primary" />
          ) : undefined,
      },
    ];
  });

  return (
    <FilterSubmenu label="Cycle" options={options} appliedFilters={appliedFilters} onToggle={handleUpdate} searchable />
  );
});
