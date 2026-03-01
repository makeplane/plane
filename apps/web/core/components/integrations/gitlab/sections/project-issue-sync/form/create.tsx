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

import type { Dispatch, SetStateAction } from "react";
import type { TGitlabEntityConnection, TIssueStateMap } from "@plane/types";
import type { TProjectMap } from "@/types/integrations";
import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { ModalCore } from "@plane/ui";
// plane web components
import { SelectProject, SelectGitlabRepository } from "../../../common";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// local imports
import { projectMapInit, stateMapInit } from "../root";
import { MapProjectIssueState, SelectIssueSyncDirection } from "./common";
import { EGitlabEntityConnectionType } from "@plane/etl/gitlab";

type TCreateProjectIssueSyncForm = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  isEnterprise: boolean;
};

export const CreateProjectIssueSyncForm = observer(function CreateProjectIssueSyncForm(
  props: TCreateProjectIssueSyncForm
) {
  // props
  const { modal, handleModal, isEnterprise } = props;

  // hooks
  const {
    workspace,
    fetchStates,
    entityConnection: { createEntityConnectionV2, entityConnectionById, entityConnectionIds },
  } = useGitlabIntegration(isEnterprise);
  const { t } = useTranslation();

  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [projectMap, setProjectMap] = useState<TProjectMap>(projectMapInit);
  const [stateMap, setStateMap] = useState<TIssueStateMap>(stateMapInit);
  const [allowBidirectionalSync, setAllowBidirectionalSync] = useState<boolean>(true);

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const entityConnections = entityConnectionIds
    .map((id) => {
      const entity = entityConnectionById(id);
      if (entity?.type !== EGitlabEntityConnectionType.PROJECT_ISSUE_SYNC) return undefined;
      return entity;
    })
    .filter((entity) => entity !== undefined);

  const existingProjectIds = entityConnections
    .map((entity) => entity?.project_id)
    .filter((id) => id !== undefined && id !== null);

  const existingGitlabRepositoryIds = entityConnections
    .filter((entity) => entity?.type === EGitlabEntityConnectionType.PROJECT_ISSUE_SYNC)
    .map((entity) => entity?.entity_id)
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

      const payload: Partial<TGitlabEntityConnection> = {
        entity_id: projectMap.entityId,
        project_id: projectMap.projectId,
        config: {
          states: { issueEventMapping: stateMap },
          allowBidirectionalSync,
        },
        entity_type: isEnterprise ? E_INTEGRATION_KEYS.GITLAB_ENTERPRISE : E_INTEGRATION_KEYS.GITLAB,
        type: EGitlabEntityConnectionType.PROJECT_ISSUE_SYNC,
      };
      await createEntityConnectionV2(payload);

      setProjectMap(projectMapInit);
      setStateMap(stateMapInit);
      setAllowBidirectionalSync(true);
      handleModal(false);
    } catch (error) {
      console.error("handleSubmit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // disable submit if form fields are not filled
  const disableSubmit = isSubmitting || !projectMap.projectId || !projectMap.entityId;

  return (
    <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
      <div className="space-y-5 p-5">
        <div className="text-heading-sm-medium text-secondary">{t("gitlab_integration.link")}</div>

        <div className="space-y-4">
          <div className="space-y-1">
            <SelectProject
              value={projectMap}
              handleChange={handleProjectMapChange}
              isEnterprise={isEnterprise}
              excludeProjectIds={existingProjectIds}
            />
            <SelectGitlabRepository
              value={projectMap}
              handleChange={handleProjectMapChange}
              isEnterprise={isEnterprise}
              excludeGitlabRepositoryIds={existingGitlabRepositoryIds}
            />
          </div>
          <div className="border border-subtle divide-y divide-subtle rounded-md">
            <div className="relative space-y-1 p-3">
              <div className="text-body-sm-medium">{t("gitlab_integration.project_issue_sync")}</div>
              <div className="text-caption-sm-regular text-secondary">
                {t("gitlab_integration.configure_project_issue_sync_state")}
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
              {isSubmitting ? t("common.processing") : t("gitlab_integration.start_sync")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
