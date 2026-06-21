/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CycleIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { PageHead } from "@/components/core/page-title";
import { SprintAutomationModal } from "@/components/workspace/sprints/automation-modal";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";

const WorkspaceSquadsPage = observer(function WorkspaceSquadsPage() {
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    currentWorkspaceSprintSquadIds,
    fetchWorkspaceSprintSquads,
    fetchWorkspaceSprints,
    getSprintSquadById,
    getSprintsBySquadId,
  } = useWorkspaceSprint();

  const workspaceSlugValue = workspaceSlug?.toString();
  const squadIds = currentWorkspaceSprintSquadIds ?? [];

  useEffect(() => {
    if (!workspaceSlugValue) return;
    fetchWorkspaceSprintSquads(workspaceSlugValue);
    fetchWorkspaceSprints(workspaceSlugValue);
  }, [fetchWorkspaceSprintSquads, fetchWorkspaceSprints, workspaceSlugValue]);

  const openSquad = (squadId: string) => {
    if (!workspaceSlugValue) return;

    const sprintIds = getSprintsBySquadId(squadId);
    const href = sprintIds[0]
      ? `/${workspaceSlugValue}/sprints/work-items/${sprintIds[0]}`
      : `/${workspaceSlugValue}/sprints/${squadId}`;

    router.push(href);
  };

  return (
    <>
      <PageHead title="Squads" />
      <SprintAutomationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(squadId) => openSquad(squadId)}
      />
      <div className="h-full overflow-y-auto bg-surface-1 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-20 font-semibold text-primary">Squads</h2>
            <p className="mt-1 text-13 text-tertiary">Manage sprint squads and their active sprints.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            Create squad
          </Button>
        </div>
        {squadIds.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-subtle text-13 text-tertiary">
            No squads yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2 @6xl:grid-cols-3">
            {squadIds.map((squadId) => {
              const squad = getSprintSquadById(squadId);
              if (!squad) return null;

              const openSprintCount = getSprintsBySquadId(squad.id).length;

              return (
                <div
                  key={squad.id}
                  className="rounded-lg border border-subtle bg-surface-2 p-4 text-left hover:bg-surface-1"
                >
                  <button
                    type="button"
                    onClick={() => openSquad(squad.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-surface-1">
                      {squad.logo_props?.in_use ? (
                        <Logo logo={squad.logo_props} size={18} type="material" />
                      ) : (
                        <CycleIcon className="size-4 text-tertiary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-15 truncate font-medium text-primary">{squad.name}</div>
                      <div className="truncate text-12 text-tertiary">{squad.name_template}</div>
                    </div>
                  </button>
                  <div className="mt-4 text-12 text-secondary">
                    {squad.sprint_duration_days} day sprint - {openSprintCount} open sprint
                    {openSprintCount === 1 ? "" : "s"}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openSquad(squad.id)}>
                      Open
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/${workspaceSlugValue}/sprints/${squad.id}?view=settings`)}
                    >
                      Settings
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
});

export default WorkspaceSquadsPage;
