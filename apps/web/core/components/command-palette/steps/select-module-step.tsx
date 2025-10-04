"use client";

import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { Command } from "cmdk";
import { IModule } from "@plane/types";
import { DiceIcon } from "@plane/propel/icons";
import { useModule } from "@/hooks/store/use-module";

interface SelectModuleStepProps {
  workspaceSlug: string;
  projectId: string;
  onSelect: (module: IModule) => void;
  filterCondition?: (module: IModule) => boolean;
}

/**
 * Reusable module selection step component
 * Can be used in any multi-step command flow
 */
export const SelectModuleStep: React.FC<SelectModuleStepProps> = observer(({
  workspaceSlug,
  projectId,
  onSelect,
  filterCondition,
}) => {
  const { getProjectModuleIds, getModuleById, fetchModules } = useModule();

  const projectModuleIds = projectId ? getProjectModuleIds(projectId) : null;

  const moduleOptions = useMemo(() => {
    const modules: IModule[] = [];
    if (projectModuleIds) {
      projectModuleIds.forEach((mid) => {
        const module = getModuleById(mid);
        if (module) {
          modules.push(module);
        }
      });
    }

    const filtered = filterCondition ? modules.filter(filterCondition) : modules;

    return filtered.sort(
      (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
    );
  }, [projectModuleIds, getModuleById, filterCondition]);

  useEffect(() => {
    if (workspaceSlug && projectId) {
      fetchModules(workspaceSlug, projectId);
    }
  }, [workspaceSlug, projectId, fetchModules]);

  if (!workspaceSlug || !projectId) return null;

  return (
    <Command.Group heading="Modules">
      {moduleOptions.map((module) => (
        <Command.Item
          key={module.id}
          onSelect={() => onSelect(module)}
          className="focus:outline-none"
        >
          <div className="flex items-center gap-2 text-custom-text-200">
            <DiceIcon className="h-3.5 w-3.5" />
            {module.name}
          </div>
        </Command.Item>
      ))}
    </Command.Group>
  );
});
