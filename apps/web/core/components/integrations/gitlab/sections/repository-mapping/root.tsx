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
import { EConnectionType } from "@plane/etl/gitlab";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TStateMap } from "@plane/types";
import { E_STATE_MAP_KEYS } from "@plane/types";
import { Loader } from "@plane/ui";
// plane web components
import { EntityConnectionItem, EntityFormCreate, ProjectEntityFormCreate } from "@/components/integrations/gitlab";
//  plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations/gitlab";

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

interface IRepositoryMappingRootProps {
  isEntitiesLoading: boolean;
  isEnterprise: boolean;
}

export const RepositoryMappingRoot = observer(function RepositoryMappingRoot({
  isEntitiesLoading,
  isEnterprise,
}: IRepositoryMappingRootProps) {
  // hooks
  const {
    entityConnection: { entityConnectionIds, entityConnectionById },
  } = useGitlabIntegration(isEnterprise);
  const { t } = useTranslation();

  // states
  const [modalCreateOpen, setModalCreateOpen] = useState<boolean>(false);
  const [modalProjectCreateOpen, setModalProjectCreateOpen] = useState<boolean>(false);

  // derived values
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

  return (
    <div className="space-y-4">
      <div className="relative border border-subtle rounded-sm p-4 space-y-4">
        {/* heading */}
        <div className="relative flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="text-body-sm-medium">{t("gitlab_integration.project_connections")}</div>
            <div className="text-body-xs-regular text-secondary">
              {t("gitlab_integration.project_connections_description")}
            </div>
          </div>
          <Button variant="secondary" onClick={() => setModalCreateOpen(true)}>
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
                  <EntityConnectionItem key={index} entityConnection={entityConnection} isEnterprise={isEnterprise} />
                </div>
              );
            })}
          </div>
        )}
        <EntityFormCreate modal={modalCreateOpen} handleModal={setModalCreateOpen} isEnterprise={isEnterprise} />
      </div>

      {/* Add project state mapping blocks */}
      <div className="relative border border-subtle rounded-sm p-4 space-y-4">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-4">
          <div className="space-y-1">
            <div className="text-body-sm-medium">{t("gitlab_integration.plane_project_connection")}</div>
            <div className="text-body-xs-regular text-secondary">
              {t("gitlab_integration.plane_project_connection_description")}
            </div>
          </div>
          <Button variant="secondary" onClick={() => setModalProjectCreateOpen(true)}>
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
                  <EntityConnectionItem key={index} entityConnection={entityConnection} isEnterprise={isEnterprise} />
                </div>
              );
            })}
          </div>
        )}

        {/* project entity form */}
        <ProjectEntityFormCreate
          modal={modalProjectCreateOpen}
          handleModal={setModalProjectCreateOpen}
          isEnterprise={isEnterprise}
        />
      </div>
    </div>
  );
});
