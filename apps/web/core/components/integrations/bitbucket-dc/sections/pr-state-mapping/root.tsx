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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { PlusIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import type { TBitbucketEntityConnection } from "@plane/types";
import { MappingLoader } from "@/components/integrations/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import { CreatePRStateMappingForm } from "./create-form";
import { PRStateMappingEntityItem } from "./entity-item";

export const PRStateMappingRoot = observer(function PRStateMappingRoot() {
  const {
    workspace,
    fetchProjects,
    getProjectById,
    data: { fetchBitbucketRepositories },
    entity: { entityIds, entityById, fetchEntities },
  } = useBitbucketDCIntegration();

  const [modalCreateOpen, setModalCreateOpen] = useState(false);

  const workspaceId = workspace?.id;
  const workspaceSlug = workspace?.slug;

  const entityConnectionMap = entityIds.map((id) => entityById(id));
  const entityConnections = entityConnectionMap.reduce(
    (result: Record<string, TBitbucketEntityConnection[]>, entity) => {
      if (entity?.type !== "PROJECT_PR_AUTOMATION") return result;
      const projectId = entity.project_id || "default";
      if (!result[projectId]) result[projectId] = [];
      result[projectId].push(entity);
      return result;
    },
    {}
  );

  const { isLoading: isProjectsLoading } = useSWR(
    workspaceSlug ? `BITBUCKET_DC_INTEGRATION_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  const { isLoading: isRepositoriesLoading } = useSWR(
    workspaceId ? `BITBUCKET_DC_INTEGRATION_REPOSITORIES_${workspaceId}` : null,
    workspaceId ? () => fetchBitbucketRepositories() : null,
    { errorRetryCount: 0 }
  );

  const { isLoading: isEntitiesLoading } = useSWR(
    workspaceId ? `BITBUCKET_DC_INTEGRATION_ENTITY_CONNECTIONS_${workspaceId}` : null,
    workspaceId ? () => fetchEntities() : null,
    { errorRetryCount: 0 }
  );

  if (isEntitiesLoading || isProjectsLoading || isRepositoriesLoading) return <MappingLoader />;

  return (
    <div className="relative border border-subtle rounded-md">
      <div className="flex flex-row items-center justify-between py-5 px-5 bg-layer-1 border-b border-subtle">
        <div className="space-y-1">
          <div className="text-body-sm-medium">PR State Mapping</div>
          <div className="text-body-xs-regular text-secondary">
            Map Bitbucket pull request events to Plane issue states.
          </div>
        </div>
        <Button variant="secondary" className="h-8 w-8 rounded-sm p-0" onClick={() => setModalCreateOpen(true)}>
          <PlusIcon className="h-5 w-5" />
        </Button>
      </div>

      {Object.keys(entityConnections).length > 0 ? (
        <div className="p-4 relative space-y-4">
          {Object.keys(entityConnections).map((projectId, index) => {
            const project = getProjectById(projectId);
            if (!project) return null;
            return (
              <div key={index} className="space-y-4">
                {entityConnections[projectId].map((connection, i) => (
                  <PRStateMappingEntityItem key={i} project={project} entityConnection={connection} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 relative text-center">
          <div className="text-body-xs-regular text-secondary">No PR state mappings yet. Click + to add one.</div>
        </div>
      )}

      <CreatePRStateMappingForm modal={modalCreateOpen} handleModal={setModalCreateOpen} />
    </div>
  );
});
