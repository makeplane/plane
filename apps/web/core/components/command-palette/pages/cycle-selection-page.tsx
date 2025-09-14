"use client";

import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react";
// plane types
import { ICycle } from "@plane/types";
import { joinUrlPath } from "@plane/utils";
// components
import { CommandPaletteCycleSelector } from "@/components/command-palette";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useAppRouter } from "@/hooks/use-app-router";

interface ICycleSelectionPageProps {
  workspaceSlug: string | undefined;
  selectedProjectId: string | null;
}

export const CycleSelectionPage: React.FC<ICycleSelectionPageProps> = observer((props) => {
  const { workspaceSlug, selectedProjectId } = props;
  // router
  const router = useAppRouter();
  // store
  const { getProjectCycleIds, getCycleById, fetchAllCycles } = useCycle();
  const { toggleCommandPaletteModal } = useCommandPalette();
  // derived values
  const projectCycleIds = selectedProjectId ? getProjectCycleIds(selectedProjectId) : null;

  const cycleOptions = useMemo(() => {
    const cycles: ICycle[] = [];
    if (projectCycleIds) {
      if (projectCycleIds) {
        projectCycleIds.forEach((cid) => {
          const cycle = getCycleById(cid);
          const status = cycle?.status ? cycle.status.toLowerCase() : "";
          if (cycle && ["current", "upcoming"].includes(status)) cycles.push(cycle);
        });
      }
    }
    return cycles.sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
  }, [projectCycleIds, getCycleById]);

  useEffect(() => {
    if (workspaceSlug && selectedProjectId) {
      fetchAllCycles(workspaceSlug.toString(), selectedProjectId);
    }
  }, [workspaceSlug, selectedProjectId, fetchAllCycles]);

  if (!workspaceSlug || !selectedProjectId) return null;

  return (
    <CommandPaletteCycleSelector
      cycles={cycleOptions}
      onSelect={(cycle) => {
        toggleCommandPaletteModal(false);
        router.push(joinUrlPath(workspaceSlug, "projects", cycle.project_id, "cycles", cycle.id));
      }}
    />
  );
});
