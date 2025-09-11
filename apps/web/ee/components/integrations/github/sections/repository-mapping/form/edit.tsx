"use client";

import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { GITHUB_INTEGRATION_TRACKER_EVENTS } from "@plane/constants";
import { Button, ModalCore } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { ProjectForm, StateForm } from "@/plane-web/components/integrations/github";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import { E_STATE_MAP_KEYS, TGithubEntityConnection, TProjectMap, TStateMap } from "@/plane-web/types/integrations";
// local imports
import { projectMapInit, stateMapInit } from "../root";

type TFormEdit = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  data: TGithubEntityConnection;
  isEnterprise: boolean;
};

export const FormEdit: FC<TFormEdit> = observer((props) => {
  // props
  const { modal, handleModal, data, isEnterprise } = props;

  // hooks
  const {
    workspace,
    fetchStates,
    entity: { updateEntity },
  } = useGithubIntegration(isEnterprise);

  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [projectMap, setProjectMap] = useState<TProjectMap>(projectMapInit);
  const [stateMap, setStateMap] = useState<TStateMap>(stateMapInit);

  // derived values
  const workspaceSlug = workspace?.slug || undefined;

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

  const handleStateMapChange = <T extends keyof TStateMap>(key: T, value: (typeof stateMap)[T]) => {
    setStateMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload: Partial<TGithubEntityConnection> = {
        entity_id: projectMap.entityId,
        project_id: projectMap.projectId,
        config: {
          states: { mergeRequestEventMapping: stateMap },
        },
      };
      await updateEntity(data.id, payload);
      captureSuccess({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.update_entity_connection,
        payload: {
          id: data.id,
        },
      });

      handleModal(false);
    } catch (error) {
      console.error("handleSubmit", error);
      captureError({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.update_entity_connection,
        payload: {
          id: data.id,
        },
      });
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
    if (workspaceSlug && data.project_id) {
      updateEntityConnection(workspaceSlug, data.project_id);
    }
  }, [workspaceSlug, data, fetchStates]);

  return (
    <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
      <div className="space-y-5 p-5">
        <div className="text-xl font-medium text-custom-text-200">Link Github repository and Plane project</div>

        <div className="space-y-4">
          <ProjectForm value={projectMap} handleChange={handleProjectMapChange} isEnterprise={isEnterprise} />

          <div className="border border-custom-border-200 divide-y divide-custom-border-200 rounded">
            <div className="relative space-y-1 p-3">
              <div className="text-base">Pull request automation</div>
              <div className="text-xs text-custom-text-200">
                With Github integration Enabled, you can automate work item workflows
              </div>
            </div>
            <div className="p-3">
              <StateForm
                projectId={projectMap?.projectId || undefined}
                value={stateMap}
                handleChange={handleStateMapChange}
                isEnterprise={isEnterprise}
              />
            </div>
          </div>

          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={() => handleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? "Processing" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
