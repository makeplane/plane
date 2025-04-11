"use client";

import { Dispatch, FC, SetStateAction, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button, ModalCore } from "@plane/ui";
// plane web components
import { ProjectForm, StateForm } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TGitlabEntityConnection, TProjectMap, TStateMap } from "@/plane-web/types/integrations/gitlab";
// local imports
import { projectMapInit, stateMapInit } from "../root";

type TFormCreate = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
};

export const FormCreate: FC<TFormCreate> = observer((props) => {
  // props
  const { modal, handleModal } = props;

  // hooks
  const {
    workspace,
    fetchStates,
    entityConnection: { createEntityConnection },
  } = useGitlabIntegration();
  const { t } = useTranslation();

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

      const payload: Partial<TGitlabEntityConnection> = {
        entity_id: projectMap.entityId,
        project_id: projectMap.projectId,
        config: {
          states: { mergeRequestEventMapping: stateMap },
        },
      };
      await createEntityConnection(payload);

      setProjectMap(projectMapInit);
      setStateMap(stateMapInit);

      handleModal(false);
    } catch (error) {
      console.error("handleSubmit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
      <div className="space-y-5 p-5">
        <div className="text-xl font-medium text-custom-text-200">{t("gitlab_integration.link")}</div>

        <div className="space-y-4">
          <ProjectForm value={projectMap} handleChange={handleProjectMapChange} />

          <div className="border border-custom-border-200 divide-y divide-custom-border-200 rounded">
            <div className="relative space-y-1 p-3">
              <div className="text-base">{t("gitlab_integration.pull_request_automation")}</div>
              <div className="text-xs text-custom-text-200">
                {t("gitlab_integration.integration_enabled_text")}
              </div>
            </div>
            <div className="p-3">
              <StateForm
                projectId={projectMap?.projectId || undefined}
                value={stateMap}
                handleChange={handleStateMapChange}
              />
            </div>
          </div>

          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={() => handleModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? t("common.processing") : t("common.continue")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
