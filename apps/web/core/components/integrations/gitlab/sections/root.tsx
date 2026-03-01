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
import { observer } from "mobx-react";
// plane web components
import { RepositoryMappingRoot } from "@/components/integrations/gitlab";
import { ProjectIssueSyncRoot } from "./project-issue-sync/root";
import { useGitlabIntegration } from "@/plane-web/hooks/store/integrations/use-gitlab";
import useSWR from "swr";
import { MappingLoader } from "../../ui";

interface IIntegrationRootProps {
  isEnterprise: boolean;
}

export const IntegrationRoot = observer(function IntegrationRoot({ isEnterprise }: IIntegrationRootProps) {
  const {
    workspace,
    fetchProjects,
    auth: { workspaceConnectionIds },
    data: { fetchGitlabEntities },
    entityConnection: { fetchEntityConnections },
  } = useGitlabIntegration(isEnterprise);

  const workspaceId = workspace?.id || undefined;
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;

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
    workspaceId ? `INTEGRATION_ENTITY_CONNECTIONS_${workspaceId}` : null,
    workspaceId ? async () => fetchEntityConnections() : null,
    { errorRetryCount: 0 }
  );

  // Loading state with skeleton loader
  if (isEntitiesLoading || isProjectsLoading || isGitlabEntitiesLoading) {
    return <MappingLoader />;
  }

  return (
    <div className="relative space-y-4">
      <RepositoryMappingRoot isEntitiesLoading={isEntitiesLoading} isEnterprise={isEnterprise} />
      <ProjectIssueSyncRoot isEnterprise={isEnterprise} />
    </div>
  );
});
