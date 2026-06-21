/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CycleIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { ProjectAppliedFiltersList } from "@/components/project/applied-filters";
import { ProjectCard } from "@/components/project/card";
import { ProjectsLoader } from "@/components/ui/loader/projects-loader";
import { useProject } from "@/hooks/store/use-project";
import { useProjectFilter } from "@/hooks/store/use-project-filter";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";

const formatDate = (date: string | null) => {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
};

export const WorkspaceArchivesRoot = observer(function WorkspaceArchivesRoot() {
  const { workspaceSlug } = useParams();
  const workspaceSlugValue = workspaceSlug?.toString();
  const [isSprintsLoading, setIsSprintsLoading] = useState(false);
  const [restoringSquadId, setRestoringSquadId] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const { archivedProjectIds, fetchProjects, fetchStatus, filteredProjectIds, getProjectById, loader } = useProject();
  const {
    currentWorkspaceAppliedDisplayFilters,
    currentWorkspaceFilters,
    clearAllAppliedDisplayFilters,
    clearAllFilters,
    updateDisplayFilters,
    updateFilters,
  } = useProjectFilter();
  const {
    currentWorkspaceArchivedSprintSquadIds,
    fetchArchivedWorkspaceSprintSquads,
    fetchWorkspaceSprintAutomations,
    getSprintSquadById,
    restoreWorkspaceSprintSquad,
  } = useWorkspaceSprint();

  const allowedDisplayFilters =
    currentWorkspaceAppliedDisplayFilters?.filter((filter) => filter !== "archived_projects") ?? [];
  const projectFiltersCount = calculateTotalFilters(currentWorkspaceFilters ?? {});
  const isProjectListLoading =
    !filteredProjectIds || !archivedProjectIds || loader === "init-loader" || fetchStatus !== "complete";
  const archivedSquadIds = currentWorkspaceArchivedSprintSquadIds ?? [];

  useSWR(
    workspaceSlugValue && currentWorkspace ? `WORKSPACE_PROJECTS_${workspaceSlugValue}` : null,
    workspaceSlugValue && currentWorkspace ? () => fetchProjects(workspaceSlugValue) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!workspaceSlugValue) return;
    updateDisplayFilters(workspaceSlugValue, { archived_projects: true });
  }, [updateDisplayFilters, workspaceSlugValue]);

  useEffect(() => {
    if (!workspaceSlugValue) return;

    setIsSprintsLoading(true);
    Promise.all([
      fetchWorkspaceSprintAutomations(workspaceSlugValue),
      fetchArchivedWorkspaceSprintSquads(workspaceSlugValue),
    ])
      .catch(() => undefined)
      .finally(() => setIsSprintsLoading(false));
  }, [fetchArchivedWorkspaceSprintSquads, fetchWorkspaceSprintAutomations, workspaceSlugValue]);

  const handleRemoveFilter = useCallback(
    (key: keyof TProjectFilters, value: string | null) => {
      if (!workspaceSlugValue) return;
      let newValues = currentWorkspaceFilters?.[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(workspaceSlugValue, { [key]: newValues });
    },
    [currentWorkspaceFilters, updateFilters, workspaceSlugValue]
  );

  const handleRemoveDisplayFilter = useCallback(
    (key: TProjectAppliedDisplayFilterKeys) => {
      if (!workspaceSlugValue) return;
      updateDisplayFilters(workspaceSlugValue, { [key]: false });
    },
    [updateDisplayFilters, workspaceSlugValue]
  );

  const handleClearAllFilters = useCallback(() => {
    if (!workspaceSlugValue) return;
    clearAllFilters(workspaceSlugValue);
    clearAllAppliedDisplayFilters(workspaceSlugValue);
    updateDisplayFilters(workspaceSlugValue, { archived_projects: true });
  }, [clearAllAppliedDisplayFilters, clearAllFilters, updateDisplayFilters, workspaceSlugValue]);

  const handleRestoreSquad = useCallback(
    async (squadId: string) => {
      if (!workspaceSlugValue) return;

      setRestoringSquadId(squadId);
      try {
        await restoreWorkspaceSprintSquad(workspaceSlugValue, squadId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Squad restored",
          message: "The squad is back in squad navigation.",
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Could not restore squad",
          message: "Please try again.",
        });
      } finally {
        setRestoringSquadId(null);
      }
    },
    [restoreWorkspaceSprintSquad, workspaceSlugValue]
  );

  return (
    <>
      <PageHead title={currentWorkspace?.name ? `${currentWorkspace.name} - Archives` : "Archives"} />
      <div className="flex h-full w-full flex-col gap-8 p-5">
        <section className="flex flex-col gap-4">
          <ArchiveSectionHeader title="Archived projects" count={filteredProjectIds?.length ?? 0} />
          {(projectFiltersCount !== 0 || allowedDisplayFilters.length > 0) && (
            <ProjectAppliedFiltersList
              appliedFilters={currentWorkspaceFilters ?? {}}
              appliedDisplayFilters={allowedDisplayFilters}
              handleClearAllFilters={handleClearAllFilters}
              handleRemoveFilter={handleRemoveFilter}
              handleRemoveDisplayFilter={handleRemoveDisplayFilter}
              filteredProjects={filteredProjectIds?.length ?? 0}
              totalProjects={archivedProjectIds?.length ?? 0}
              alwaysAllowEditing
            />
          )}
          {isProjectListLoading ? (
            <ProjectsLoader />
          ) : filteredProjectIds.length === 0 ? (
            <ArchiveEmptyState message="No archived projects yet." />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjectIds.map((projectId) => {
                const project = getProjectById(projectId);
                if (!project) return null;
                return <ProjectCard key={project.id} project={project} />;
              })}
            </div>
          )}
        </section>
        <section className="flex flex-col gap-4">
          <ArchiveSectionHeader title="Archived squads" count={archivedSquadIds.length} />
          {isSprintsLoading ? (
            <ArchiveEmptyState message="Loading archived squads..." />
          ) : archivedSquadIds.length === 0 ? (
            <ArchiveEmptyState message="No archived squads yet." />
          ) : (
            <div className="space-y-2">
              {archivedSquadIds.map((squadId) => {
                const squad = getSprintSquadById(squadId);
                if (!squad || !workspaceSlugValue) return null;

                return (
                  <div
                    key={squad.id}
                    className="flex items-center justify-between gap-4 rounded-md border border-subtle bg-surface-1 px-4 py-3 hover:bg-surface-2"
                  >
                    <Link
                      href={`/${workspaceSlugValue}/sprints/${squad.id}?view=settings`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded bg-surface-2 text-tertiary">
                        {squad.logo_props?.in_use ? (
                          <Logo logo={squad.logo_props} size={16} type="material" />
                        ) : (
                          <CycleIcon className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-14 font-medium text-primary">{squad.name}</h3>
                        <p className="mt-1 truncate text-12 text-tertiary">
                          Archived {formatDate(squad.archived_at ?? null)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-tertiary">
                        {squad.sprint_duration_days} day sprints
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestoreSquad(squad.id)}
                        loading={restoringSquadId === squad.id}
                      >
                        Unarchive
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
});

type ArchiveSectionHeaderProps = {
  count: number;
  title: string;
};

function ArchiveSectionHeader({ count, title }: ArchiveSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-16 font-semibold text-primary">{title}</h2>
      <span className="rounded bg-surface-2 px-2 py-1 text-12 text-tertiary">{count}</span>
    </div>
  );
}

function ArchiveEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-subtle text-13 text-tertiary">
      {message}
    </div>
  );
}
