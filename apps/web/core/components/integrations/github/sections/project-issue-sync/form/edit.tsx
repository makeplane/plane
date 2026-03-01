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

import type { Dispatch, FC, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// Plane imports
import { EGithubEntityConnectionType } from "@plane/etl/github";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TGithubEntityConnection, TIssueStateMap } from "@plane/types";
import { E_ISSUE_STATE_MAP_KEYS } from "@plane/types";
import { ModalCore } from "@plane/ui";
// plane web components
import { SelectProject, SelectGithubRepository } from "@/components/integrations/github/common";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations";
// local imports
import { projectMapInit, stateMapInit } from "../root";
import { MapProjectIssueState, SelectIssueSyncDirection } from "./common";

type TEditProjectIssueSyncForm = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  data: TGithubEntityConnection;
  isEnterprise: boolean;
};

export const EditProjectIssueSyncForm = observer(function EditProjectIssueSyncForm(props: TEditProjectIssueSyncForm) {
  // props
  const { modal, handleModal, data, isEnterprise } = props;

  // hooks
  const {
    workspace,
    fetchStates,
    entity: { updateEntity, entityById, entityIds },
  } = useGithubIntegration(isEnterprise);
  const { t } = useTranslation();

  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [projectMap, setProjectMap] = useState<TProjectMap>(projectMapInit);
  const [stateMap, setStateMap] = useState<TIssueStateMap>(stateMapInit);
  const [allowBidirectionalSync, setAllowBidirectionalSync] = useState<boolean>(true);
  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const entityConnections = entityIds
    .map((id) => {
      const entity = entityById(id);
      if (entity?.type !== EGithubEntityConnectionType.PROJECT_ISSUE_SYNC) return undefined;
      return entity;
    })
    .filter((entity) => entity !== undefined);

  const existingProjectIds = entityConnections
    .map((entity) => entity?.project_id)
    .filter((id) => id !== data.project_id)
    .filter((id) => id !== undefined && id !== null);

  // handlers
  const handleProjectMapChange = <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => {
    if (key === "projectId") {
      setProjectMap((prev) => ({ ...prev, [key]: value }));
      if (workspaceSlug && value && value != projectMap.projectId) {
        fetchStates(workspaceSlug, value);
        setStateMap(stateMapInit);
      }
    } else {
      setProjectMap((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleStateMapChange = <T extends keyof TIssueStateMap>(key: T, value: (typeof stateMap)[T]) => {
    setStateMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleAllowBidirectionalSync = (value: boolean) => {
    setAllowBidirectionalSync(value);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload: Partial<TGithubEntityConnection> = {
        entity_id: projectMap.entityId,
        project_id: projectMap.projectId,
        config: {
          states: { issueEventMapping: stateMap },
          allowBidirectionalSync,
        },
        type: EGithubEntityConnectionType.PROJECT_ISSUE_SYNC,
      };
      await updateEntity(data.id, payload);
      handleModal(false);
    } catch (error) {
      console.error("handleSubmit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const updateEntityConnection = async (workspaceSlug: string, projectId: string) => {
      await fetchStates(workspaceSlug, projectId);
      setProjectMap({
        entityId: data.entity_id!,
        projectId: projectId,
      });
      setAllowBidirectionalSync(data.config?.allowBidirectionalSync ?? true);

      setStateMap({
        [E_ISSUE_STATE_MAP_KEYS.ISSUE_OPEN]:
          data.config?.states?.issueEventMapping?.[E_ISSUE_STATE_MAP_KEYS.ISSUE_OPEN],
        [E_ISSUE_STATE_MAP_KEYS.ISSUE_CLOSED]:
          data.config?.states?.issueEventMapping?.[E_ISSUE_STATE_MAP_KEYS.ISSUE_CLOSED],
      });
    };
    if (workspaceSlug && data.project_id) {
      updateEntityConnection(workspaceSlug, data.project_id);
    }
  }, [workspaceSlug, data, fetchStates]);

  const disableSubmit = isSubmitting || !projectMap.projectId || !projectMap.entityId;

  return (
    <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
      <div className="space-y-5 p-5">
        <div className="text-heading-sm-medium text-secondary">{t("github_integration.link")}</div>

        <div className="space-y-4">
          <div className="space-y-1">
            <SelectProject
              value={projectMap}
              handleChange={handleProjectMapChange}
              isEnterprise={isEnterprise}
              excludeProjectIds={existingProjectIds}
            />
            <SelectGithubRepository
              value={projectMap}
              handleChange={handleProjectMapChange}
              isEnterprise={isEnterprise}
            />
          </div>

          <div className="border border-subtle divide-y divide-subtle rounded">
            <div className="relative space-y-1 p-3">
              <div className="text-body-sm-medium">{t("github_integration.project_issue_sync")}</div>
              <div className="text-caption-sm-regular text-secondary">
                {t("github_integration.configure_project_issue_sync_state")}
              </div>
            </div>
            <div className="p-3">
              <MapProjectIssueState
                projectId={projectMap?.projectId || undefined}
                value={stateMap}
                handleChange={handleStateMapChange}
                isEnterprise={isEnterprise}
              />
            </div>
          </div>

          <SelectIssueSyncDirection value={allowBidirectionalSync} onChange={handleAllowBidirectionalSync} />

          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={() => handleModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={disableSubmit}>
              {isSubmitting ? t("common.processing") : t("github_integration.save")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
