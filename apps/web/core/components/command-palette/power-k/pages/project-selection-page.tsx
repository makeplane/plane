"use client";

import React, { useMemo } from "react";
// plane imports
import type { IPartialProject } from "@plane/types";
// components
import { CommandPaletteProjectSelector } from "@/components/command-palette";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string | undefined;
  projectSelectionAction: "navigate" | "cycle" | null;
  setSelectedProjectId: (id: string | null) => void;
  fetchAllCycles: (workspaceSlug: string, projectId: string) => void;
  setPages: (pages: string[] | ((prev: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
};

export const ProjectSelectionPage: React.FC<Props> = (props) => {
  const { workspaceSlug, projectSelectionAction, setSelectedProjectId, fetchAllCycles, setPages, setPlaceholder } =
    props;
  // router
  const router = useAppRouter();
  // store
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const { toggleCommandPaletteModal } = useCommandPalette();

  // Get projects data - ensure reactivity to store changes
  const projectOptions = useMemo(() => {
    if (!joinedProjectIds?.length) return [];

    const list: IPartialProject[] = [];
    joinedProjectIds.forEach((id) => {
      const project = getPartialProjectById(id);
      if (project) list.push(project);
    });
    return list
      .filter((p) => (projectSelectionAction === "cycle" ? p.cycle_view : true))
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime());
  }, [joinedProjectIds, getPartialProjectById, projectSelectionAction]);

  if (!workspaceSlug) return null;

  return (
    <CommandPaletteProjectSelector
      projects={projectOptions}
      onSelect={(project) => {
        if (projectSelectionAction === "navigate") {
          toggleCommandPaletteModal(false);
          router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
        } else if (projectSelectionAction === "cycle") {
          setSelectedProjectId(project.id);
          setPages((p) => [...p, "open-cycle"]);
          setPlaceholder("Search cycles");
          fetchAllCycles(workspaceSlug.toString(), project.id);
        }
      }}
    />
  );
};
