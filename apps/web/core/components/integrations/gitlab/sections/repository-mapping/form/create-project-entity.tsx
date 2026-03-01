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
import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TGitlabEntityConnection, TStateMap } from "@plane/types";
import { ModalCore } from "@plane/ui";
// plane web components
import { ProjectForm, StateForm } from "@/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations/gitlab";
// local imports
import { projectMapInit, stateMapInit } from "../root";

type TProjectEntityFormCreate = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  isEnterprise: boolean;
};

export const ProjectEntityFormCreate = observer(function ProjectEntityFormCreate(props: TProjectEntityFormCreate) {
  // props
  const { modal, handleModal, isEnterprise } = props;

  // hooks
  const {
    workspace,
    fetchStates,
    entityConnection: { createProjectConnection },
  } = useGitlabIntegration(isEnterprise);
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
      await createProjectConnection(payload);

      setStateMap(stateMapInit);
      setProjectMap(projectMapInit);
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
        <div className="text-heading-sm-medium text-secondary">{t("gitlab_integration.link")}</div>

        <div className="space-y-4">
          <ProjectForm value={projectMap} handleChange={handleProjectMapChange} isEnterprise={isEnterprise} />

          <div className="border border-subtle divide-y divide-subtle rounded-md">
            <div className="relative space-y-1 p-3">
              <div className="text-body-sm-medium">{t("gitlab_integration.pull_request_automation")}</div>
              <div className="text-caption-sm-regular text-secondary">
                {t("gitlab_integration.pull_request_automation_description")}
              </div>
            </div>
            {projectMap.projectId && (
              <div className="p-3">
                <StateForm
                  projectId={projectMap.projectId}
                  value={stateMap}
                  handleChange={handleStateMapChange}
                  isEnterprise={isEnterprise}
                />
              </div>
            )}
          </div>

          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={() => handleModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? t("common.processing") : t("common.continue")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
