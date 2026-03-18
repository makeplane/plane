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
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TBitbucketEntityConnection, TStateMap } from "@plane/types";
import { E_STATE_MAP_KEYS } from "@plane/types";
import { ModalCore } from "@plane/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import type { TProjectMap } from "@/types/integrations";
import { SelectBitbucketProject } from "../select-project";
import { SelectBitbucketRepository } from "../select-repository";
import { MapProjectPRState } from "./map-project-pr-state";
import { SelectCommentSyncDirection } from "./select-comment-sync-direction";

const projectMapInit: TProjectMap = { entityId: undefined, projectId: undefined };
const stateMapInit: TStateMap = {
  [E_STATE_MAP_KEYS.DRAFT_MR_OPENED]: undefined,
  [E_STATE_MAP_KEYS.MR_OPENED]: undefined,
  [E_STATE_MAP_KEYS.MR_REVIEW_REQUESTED]: undefined,
  [E_STATE_MAP_KEYS.MR_READY_FOR_MERGE]: undefined,
  [E_STATE_MAP_KEYS.MR_MERGED]: undefined,
  [E_STATE_MAP_KEYS.MR_CLOSED]: undefined,
};

type TEditPRStateMappingForm = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  data: TBitbucketEntityConnection;
};

export const EditPRStateMappingForm = observer(function EditPRStateMappingForm({
  modal,
  handleModal,
  data,
}: TEditPRStateMappingForm) {
  const {
    workspace,
    fetchStates,
    data: { bitbucketRepositoryById },
    entity: { updateEntity, entityIds, entityById },
  } = useBitbucketDCIntegration();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectMap, setProjectMap] = useState<TProjectMap>(projectMapInit);
  const [stateMap, setStateMap] = useState<TStateMap>(stateMapInit);
  const [allowBidirectionalSync, setAllowBidirectionalSync] = useState(true);

  const workspaceSlug = workspace?.slug;
  const existingProjectIds = entityIds
    .map((id) => entityById(id)?.project_id)
    .filter((id): id is string => !!id && id !== data.project_id);

  const handleProjectMapChange = <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => {
    if (key === "projectId") {
      setProjectMap((prev) => ({ ...prev, [key]: value }));
      if (workspaceSlug && value && value !== projectMap.projectId) {
        void fetchStates(workspaceSlug, value);
        setStateMap(stateMapInit);
      }
    } else {
      setProjectMap((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleStateMapChange = <T extends keyof TStateMap>(key: T, value: TStateMap[T]) => {
    setStateMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      let entitySlug: string | undefined;
      let entityData: TBitbucketEntityConnection["entity_data"] | undefined;

      if (projectMap.entityId) {
        const repo = bitbucketRepositoryById(projectMap.entityId);
        if (repo) {
          entitySlug = `${repo.project.key}/${repo.slug}`;
          entityData = repo;
        }
      }

      const payload: Partial<TBitbucketEntityConnection> = {
        project_id: projectMap.projectId,
        entity_id: projectMap.entityId,
        entity_slug: entitySlug,
        entity_data: entityData,
        config: { states: { mergeRequestEventMapping: stateMap }, allowBidirectionalSync },
        type: "PROJECT_PR_AUTOMATION",
      };
      await updateEntity(data.id, payload);
      handleModal(false);
    } catch (error) {
      console.error("EditPRStateMappingForm.handleSubmit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const load = async (slug: string, projectId: string) => {
      await fetchStates(slug, projectId);
      setProjectMap({ entityId: data.entity_id ?? undefined, projectId });
      setAllowBidirectionalSync(data.config?.allowBidirectionalSync ?? true);
      setStateMap({
        [E_STATE_MAP_KEYS.DRAFT_MR_OPENED]:
          data.config?.states?.mergeRequestEventMapping?.[E_STATE_MAP_KEYS.DRAFT_MR_OPENED],
        [E_STATE_MAP_KEYS.MR_OPENED]: data.config?.states?.mergeRequestEventMapping?.[E_STATE_MAP_KEYS.MR_OPENED],
        [E_STATE_MAP_KEYS.MR_REVIEW_REQUESTED]:
          data.config?.states?.mergeRequestEventMapping?.[E_STATE_MAP_KEYS.MR_REVIEW_REQUESTED],
        [E_STATE_MAP_KEYS.MR_READY_FOR_MERGE]:
          data.config?.states?.mergeRequestEventMapping?.[E_STATE_MAP_KEYS.MR_READY_FOR_MERGE],
        [E_STATE_MAP_KEYS.MR_MERGED]: data.config?.states?.mergeRequestEventMapping?.[E_STATE_MAP_KEYS.MR_MERGED],
        [E_STATE_MAP_KEYS.MR_CLOSED]: data.config?.states?.mergeRequestEventMapping?.[E_STATE_MAP_KEYS.MR_CLOSED],
      });
    };
    if (workspaceSlug && data.project_id) void load(workspaceSlug, data.project_id);
  }, [workspaceSlug, data, fetchStates]);

  return (
    <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
      <div className="space-y-5 p-5">
        <div className="text-heading-sm-medium text-secondary">Edit PR State Mapping</div>
        <div className="space-y-4">
          <SelectBitbucketProject
            value={projectMap}
            handleChange={handleProjectMapChange}
            excludeProjectIds={existingProjectIds}
          />
          <SelectBitbucketRepository value={projectMap} handleChange={handleProjectMapChange} />
          <div className="border border-subtle divide-y divide-subtle rounded">
            <div className="relative space-y-1 p-3">
              <div className="text-body-sm-medium">Pull Request Automation</div>
              <div className="text-caption-sm-regular text-secondary">
                Map Bitbucket PR events to Plane issue states.
              </div>
            </div>
            <div className="p-3">
              <MapProjectPRState
                projectId={projectMap?.projectId}
                value={stateMap}
                handleChange={handleStateMapChange}
              />
            </div>
          </div>
          {/* <SelectCommentSyncDirection value={allowBidirectionalSync} onChange={setAllowBidirectionalSync} /> */}
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={() => handleModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              loading={isSubmitting}
              disabled={isSubmitting || !projectMap.projectId || !projectMap.entityId}
            >
              {isSubmitting ? t("common.processing") : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
