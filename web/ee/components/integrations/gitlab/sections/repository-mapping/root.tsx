"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EConnectionType } from "@plane/etl/gitlab";
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
// plane web components
import {
  EntityConnectionItem,
  EntityFormCreate,
  ProjectEntityFormCreate,
} from "@/plane-web/components/integrations/gitlab";
//  plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import {
  E_STATE_MAP_KEYS,
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
    auth: { workspaceConnectionIds },
    data: { fetchGitlabEntities },
    entityConnection: { entityConnectionIds, entityConnectionById, fetchEntityConnections },
  } = useGitlabIntegration();
  const { t } = useTranslation();

  // states
  const [modalCreateOpen, setModalCreateOpen] = useState<boolean>(false);
  const [modalProjectCreateOpen, setModalProjectCreateOpen] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const entityConnections = entityConnectionIds.map((id) => {
    const entityConnection = entityConnectionById(id);
    if (!entityConnection || entityConnection.type !== EConnectionType.ENTITY) {
      return;
    }
    return entityConnection;
  });

  const projectEntityConnections = entityConnectionIds.map((id) => {
    const entityConnection = entityConnectionById(id);
    if (!entityConnection || entityConnection.type !== EConnectionType.PLANE_PROJECT) {
      return;
    }
    return entityConnection;
  });

  // fetching external api token
  const { isLoading: isGitlabEntitiesLoading } = useSWR(
    workspaceConnectionId && workspaceId ? `INTEGRATION_GITLAB_ENTITIES_${workspaceId}_${workspaceConnectionId}` : null,
    workspaceConnectionId && workspaceId ? async () => fetchGitlabEntities() : null,
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
    workspaceId ? async () => fetchEntityConnections() : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="relative border border-custom-border-200 rounded p-4 space-y-4">
        {/* heading */}
        <div className="relative flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="text-base font-medium">{t("gitlab_integration.project_connections")}</div>
            <div className="text-sm text-custom-text-200">
              {t("gitlab_integration.project_connections_description")}
            </div>
          </div>
          <Button variant="neutral-primary" size="sm" onClick={() => setModalCreateOpen(true)}>
            {t("common.add")}
          </Button>
        </div>

        {/* entity connection list */}
        {isEntitiesLoading && (
          <Loader className="space-y-8">
            <Loader.Item height="50px" width="40%" />
            <div className="w-2/3 grid grid-cols-2 gap-x-8 gap-y-4">
              <Loader.Item height="50px" />
              <Loader.Item height="50px" />
            </div>
            <Loader.Item height="50px" width="20%" />
          </Loader>
        )}

        {entityConnectionIds && entityConnectionIds.length > 0 && (
          <div className="relative space-y-2">
            {entityConnections.map((entityConnection, index) => {
              if (!entityConnection) return null;
              return (
                <div className="space-y-2" key={index}>
                  <EntityConnectionItem key={index} entityConnection={entityConnection} />
                </div>
              );
            })}
          </div>
        )}
        <EntityFormCreate modal={modalCreateOpen} handleModal={setModalCreateOpen} />
      </div>

      {/* Add project state mapping blocks */}
      <div className="relative border border-custom-border-200 rounded p-4 space-y-4">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-4">
          <div className="space-y-1">
            <div className="text-base font-medium">{t("gitlab_integration.plane_project_connection")}</div>
            <div className="text-sm text-custom-text-200">
              {t("gitlab_integration.plane_project_connection_description")}
            </div>
          </div>
          <Button variant="neutral-primary" size="sm" onClick={() => setModalProjectCreateOpen(true)}>
            {t("common.add")}
          </Button>
        </div>

        {/* Project mapping list */}
        {entityConnectionIds && entityConnectionIds.length > 0 && (
          <div className="relative space-y-2">
            {projectEntityConnections.map((entityConnection, index) => {
              if (!entityConnection) return null;
              return (
                <div className="space-y-2" key={index}>
                  <EntityConnectionItem key={index} entityConnection={entityConnection} />
                </div>
              );
            })}
          </div>
        )}

        {/* project entity form */}
        <ProjectEntityFormCreate modal={modalProjectCreateOpen} handleModal={setModalProjectCreateOpen} />
      </div>
    </div>
  );
});
