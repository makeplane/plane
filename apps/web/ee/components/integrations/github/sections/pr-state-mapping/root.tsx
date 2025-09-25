"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { GITHUB_INTEGRATION_TRACKER_ELEMENTS } from "@plane/constants";
import { EGithubEntityConnectionType } from "@plane/etl/github";
import { useTranslation } from "@plane/i18n";
import { E_STATE_MAP_KEYS, TGithubEntityConnection, TStateMap } from "@plane/types";
import { Button } from "@plane/ui";
// plane web components
import {
  PRStateMappingEntityItem,
  CreatePRStateMappingForm,
} from "@/plane-web/components/integrations/github/sections/pr-state-mapping";
//  plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TProjectMap } from "@/plane-web/types/integrations";
import { MappingLoader } from "../../../ui";

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

interface IProjectPRStateMappingRootProps {
  isEnterprise: boolean;
}

export const ProjectPRStateMappingRoot: FC<IProjectPRStateMappingRootProps> = observer(({ isEnterprise }) => {
  // hooks
  const {
    workspace,
    fetchProjects,
    getProjectById,
    entity: { entityIds, entityById, fetchEntities },
  } = useGithubIntegration(isEnterprise);
  const { t } = useTranslation();

  // states
  const [modalCreateOpen, setModalCreateOpen] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceSlug = workspace?.slug || undefined;
  const entityConnectionMap = entityIds.map((id) => entityById(id));
  // filter out non-project PR automation entities
  const entityConnection = entityConnectionMap.reduce(
    (result: { [key: string]: TGithubEntityConnection[] }, entity) => {
      if (entity?.type !== EGithubEntityConnectionType.PROJECT_PR_AUTOMATION) return result;

      const projectId = entity?.project_id || "default";

      if (!result[projectId]) result[projectId] = [];
      result[projectId].push(entity);

      return result;
    },
    {}
  );

  // fetching plane projects
  const { isLoading: isProjectsLoading } = useSWR(
    workspaceSlug ? `INTEGRATION_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? async () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // fetching entity connections
  const { isLoading: isEntitiesLoading } = useSWR(
    workspaceId ? `INTEGRATION_ENTITY_CONNECTIONS_${workspaceId}` : null,
    workspaceId ? async () => fetchEntities() : null,
    { errorRetryCount: 0 }
  );

  // Loading state with skeleton loader
  if (isEntitiesLoading || isProjectsLoading) {
    return <MappingLoader />;
  }
  return (
    <div className="relative border border-custom-border-200 rounded">
      {/* Header */}
      <div className="flex flex-row items-center justify-between py-5 px-5 bg-custom-background-90 border-b border-custom-border-200">
        <div className="space-y-1">
          <div className="text-base font-medium">{t("github_integration.pr_state_mapping")}</div>
          <div className="text-sm text-custom-text-200">{t("github_integration.pr_state_mapping_description")}</div>
        </div>
        <Button
          variant="neutral-primary"
          size="sm"
          className="h-8 w-8 rounded p-0"
          onClick={() => setModalCreateOpen(true)}
          data-ph-element={GITHUB_INTEGRATION_TRACKER_ELEMENTS.REPOSITORY_MAPPING_HEADER_ADD_BUTTON}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* mapped blocks */}
      {Object.keys(entityConnection).length > 0 ? (
        <div className="p-4 relative space-y-4">
          {Object.keys(entityConnection).map((projectId, index) => {
            const project = projectId ? getProjectById(projectId) : undefined;
            if (!project) return null;

            return (
              <div key={index}>
                <div className="space-y-4">
                  {(entityConnection[projectId] || []).map((connection, index) => (
                    <PRStateMappingEntityItem
                      key={index}
                      project={project}
                      entityConnection={connection}
                      isEnterprise={isEnterprise}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 relative text-center">
          <div className="text-sm text-custom-text-200">{t("github_integration.pr_state_mapping_empty_state")}</div>
        </div>
      )}

      <CreatePRStateMappingForm modal={modalCreateOpen} handleModal={setModalCreateOpen} isEnterprise={isEnterprise} />
    </div>
  );
});
