"use client";

import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import type { ICycle } from "@plane/types";
// components
import { CommandPaletteCycleSelector } from "@/components/command-palette";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

interface SelectCycleStepProps {
  workspaceSlug: string;
  projectId: string;
  onSelect: (cycle: ICycle) => void;
  filterCondition?: (cycle: ICycle) => boolean;
}

/**
 * Reusable cycle selection step component
 * Can be used in any multi-step command flow
 */
export const SelectCycleStep: React.FC<SelectCycleStepProps> = observer(
  ({ workspaceSlug, projectId, onSelect, filterCondition }) => {
    const { getProjectCycleIds, getCycleById, fetchAllCycles } = useCycle();

    const projectCycleIds = projectId ? getProjectCycleIds(projectId) : null;

    const cycleOptions = useMemo(() => {
      const cycles: ICycle[] = [];
      if (projectCycleIds) {
        projectCycleIds.forEach((cid) => {
          const cycle = getCycleById(cid);
          const status = cycle?.status ? cycle.status.toLowerCase() : "";
          // By default, show current and upcoming cycles
          if (cycle && ["current", "upcoming"].includes(status)) {
            cycles.push(cycle);
          }
        });
      }

      const filtered = filterCondition ? cycles.filter(filterCondition) : cycles;

      return filtered.sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
    }, [projectCycleIds, getCycleById, filterCondition]);

    useEffect(() => {
      if (workspaceSlug && projectId) {
        fetchAllCycles(workspaceSlug, projectId);
      }
    }, [workspaceSlug, projectId, fetchAllCycles]);

    if (!workspaceSlug || !projectId) return null;

    return <CommandPaletteCycleSelector cycles={cycleOptions} onSelect={onSelect} />;
  }
);
