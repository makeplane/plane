/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { PlusIcon } from "@plane/propel/icons";
import { EGithubEntityConnectionType } from "@plane/etl/github";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TGithubEntityConnection, TStateMap } from "@plane/types";
import { E_STATE_MAP_KEYS } from "@plane/types";
// plane web components
import {
  PRStateMappingEntityItem,
  CreatePRStateMappingForm,
} from "@/components/integrations/github/sections/pr-state-mapping";
//  plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations";
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

export const ProjectPRStateMappingRoot = observer(function ProjectPRStateMappingRoot({
  isEnterprise,
}: IProjectPRStateMappingRootProps) {
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
    <div className="relative border border-subtle rounded-md">
      {/* Header */}
      <div className="flex flex-row items-center justify-between py-5 px-5 bg-layer-1 border-b border-subtle">
        <div className="space-y-1">
          <div className="text-body-sm-medium">{t("github_integration.pr_state_mapping")}</div>
          <div className="text-body-xs-regular text-secondary">
            {t("github_integration.pr_state_mapping_description")}
          </div>
        </div>
        <Button variant="secondary" className="h-8 w-8 rounded-sm p-0" onClick={() => setModalCreateOpen(true)}>
          <PlusIcon className="h-5 w-5" />
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
          <div className="text-body-xs-regular text-secondary">
            {t("github_integration.pr_state_mapping_empty_state")}
          </div>
        </div>
      )}

      <CreatePRStateMappingForm modal={modalCreateOpen} handleModal={setModalCreateOpen} isEnterprise={isEnterprise} />
    </div>
  );
});
