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
import { useState } from "react";
import { observer } from "mobx-react";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TGitlabEntityConnection } from "@plane/types";
import { ModalCore } from "@plane/ui";
// plane web components
import { EntityForm } from "@/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations/gitlab";
// local imports
import { projectMapInit } from "../root";

type TEntityFormCreate = {
  modal: boolean;
  handleModal: Dispatch<SetStateAction<boolean>>;
  isEnterprise: boolean;
};

export const EntityFormCreate = observer(function EntityFormCreate(props: TEntityFormCreate) {
  // props
  const { modal, handleModal, isEnterprise } = props;

  // hooks
  const {
    entityConnection: { createEntityConnection },
  } = useGitlabIntegration(isEnterprise);

  const { t } = useTranslation();

  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [projectMap, setProjectMap] = useState<TProjectMap>(projectMapInit);

  // handlers
  const handleProjectMapChange = <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => {
    setProjectMap((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload: Partial<TGitlabEntityConnection> = {
        entity_id: projectMap.entityId,
        project_id: projectMap.projectId,
      };
      await createEntityConnection(payload);
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
        <div className="text-heading-sm-medium text-secondary">Link Gitlab Project</div>

        <div className="space-y-4">
          <EntityForm value={projectMap} handleChange={handleProjectMapChange} isEnterprise={isEnterprise} />

          <div className="border border-subtle divide-y divide-subtle rounded-md">
            <div className="relative space-y-1 p-3">
              <div className="text-body-sm-medium">{t("gitlab_integration.pull_request_automation")}</div>
              <div className="text-caption-sm-regular text-secondary">
                {t("gitlab_integration.integration_enabled_text")}
              </div>
            </div>
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
