"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Briefcase } from "lucide-react";
import { Button } from "@plane/ui";
// plane web components
import { Logo } from "@/components/common";
import { EntityConnectionItem, FormCreate } from "@/plane-web/components/integrations/gitlab";
//  plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import {
  E_STATE_MAP_KEYS,
  TGitlabEntityConnection,
  TProjectMap,
  TStateMap,
} from "@/plane-web/types/integrations/gitlab";

export const projectMapInit: TProjectMap = {
  entityId: undefined,
  projectId: undefined,
};

export const stateMapInit: TStateMap = {
  [E_STATE_MAP_KEYS.DRAFT_MR_OPENED]: undefined,
  [E_STATE_MAP_KEYS.MR_OPENED]: undefined,
  [E_STATE_MAP_KEYS.MR_REVIEW_REQUESTED]: undefined,
  [E_STATE_MAP_KEYS.MR_READY_FOR_MERGE]: undefined,
  [E_STATE_MAP_KEYS.MR_MERGED]: undefined,
  [E_STATE_MAP_KEYS.MR_CLOSED]: undefined,
};

export const RepositoryMappingRoot: FC = observer(() => {
  // hooks
  const {
    workspace,
    fetchProjects,
    getProjectById,
    auth: { workspaceConnectionIds },
    data: { fetchGitlabRepositories },
    entity: { entityIds, entityById, fetchEntities },
  } = useGitlabIntegration();

  // states
  const [modalCreateOpen, setModalCreateOpen] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const entityConnectionMap = entityIds.map((id) => entityById(id));
  const entityConnection = entityConnectionMap.reduce(
    (result: { [key: string]: TGitlabEntityConnection[] }, entity) => {
      if (!entity) return result;

      const projectId = entity?.projectId || "default";

      if (!result[projectId]) result[projectId] = [];
      result[projectId].push(entity);

      return result;
    },
    {}
  );

  // fetching external api token
  const { isLoading: isGitlabReposLoading } = useSWR(
    workspaceConnectionId && workspaceId ? `INTEGRATION_GITLAB_REPOS_${workspaceId}_${workspaceConnectionId}` : null,
    workspaceConnectionId && workspaceId ? async () => fetchGitlabRepositories() : null,
    { errorRetryCount: 0 }
  );

  // fetching plane projects
  const { isLoading: isProjectsLoading } = useSWR(
    workspaceSlug ? `INTEGRATION_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? async () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // fetching entity connections
  const { isLoading: isEntitiesLoading } = useSWR(
    workspaceId ? `INTEGRATION_GITLAB_ENTITY_CONNECTIONS_${workspaceId}` : null,
    workspaceId ? async () => fetchEntities() : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative border border-custom-border-200 rounded p-4 space-y-4">
      {/* heading */}
      <div className="relative flex justify-between items-center gap-4">
        <div className="space-y-1">
          <div className="text-base font-medium">Repository Mapping</div>
          <div className="text-sm text-custom-text-200">Sync issues from Gitlab repository to Plane projects</div>
        </div>
        <Button variant="neutral-primary" size="sm" onClick={() => setModalCreateOpen(true)}>
          Add
        </Button>
      </div>

      {/* mapped blocks */}
      {entityIds && entityIds.length > 0 && (
        <div className="relative space-y-2">
          {Object.keys(entityConnection).map((projectId, index) => {
            const project = projectId ? getProjectById(projectId) : undefined;
            if (!project) return null;

            return (
              <div className="space-y-2" key={index}>
                <div className="relative flex items-center gap-2 rounded bg-custom-background-90/50 text-base p-2">
                  <div className="flex-shrink-0 relative flex justify-center items-center !w-5 !h-5 rounded-sm bg-custom-background-100">
                    {project && project?.logo_props ? (
                      <Logo logo={project?.logo_props} size={14} />
                    ) : (
                      <Briefcase className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-sm">{project?.name || "Project"}</div>
                </div>

                <div className="space-y-1">
                  {(entityConnection[projectId] || []).map((connection, index) => (
                    <EntityConnectionItem key={index} project={project} entityConnection={connection} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormCreate modal={modalCreateOpen} handleModal={setModalCreateOpen} />
    </div>
  );
});
