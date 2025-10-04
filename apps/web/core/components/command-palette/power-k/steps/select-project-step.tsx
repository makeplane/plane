"use client";

import React, { useMemo } from "react";
// plane imports
import type { IPartialProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { PowerKProjectsMenu } from "../menus/projects";

interface SelectProjectStepProps {
  workspaceSlug: string;
  onSelect: (project: IPartialProject) => void;
  filterCondition?: (project: IPartialProject) => boolean;
}

/**
 * Reusable project selection step component
 * Can be used in any multi-step command flow
 */
export const SelectProjectStep: React.FC<SelectProjectStepProps> = ({ workspaceSlug, onSelect, filterCondition }) => {
  const { joinedProjectIds, getPartialProjectById } = useProject();

  const projectOptions = useMemo(() => {
    if (!joinedProjectIds?.length) return [];

    const list: IPartialProject[] = [];
    joinedProjectIds.forEach((id) => {
      const project = getPartialProjectById(id);
      if (project) list.push(project);
    });

    const filtered = filterCondition ? list.filter(filterCondition) : list;

    return filtered.sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
  }, [joinedProjectIds, getPartialProjectById, filterCondition]);

  if (!workspaceSlug) return null;

  return <PowerKProjectsMenu projects={projectOptions} onSelect={onSelect} />;
};
