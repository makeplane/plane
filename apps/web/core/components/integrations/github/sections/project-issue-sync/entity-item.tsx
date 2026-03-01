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
import { useTheme } from "next-themes";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IProject, TGithubEntityConnection } from "@plane/types";
import { ModalCore } from "@plane/ui";
// assets
import GithubDarkLogo from "@/app/assets/services/github-dark.svg?url";
import GithubLightLogo from "@/app/assets/services/github-light.svg?url";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import { IntegrationsMapping } from "../../../ui/integrations-mapping";
import { EditProjectIssueSyncForm } from "./form/edit";

type TProjectIssueSyncEntityItem = {
  project: IProject;
  entityConnection: TGithubEntityConnection;
  isEnterprise: boolean;
};

export const ProjectIssueSyncEntityItem = observer(function ProjectIssueSyncEntityItem(
  props: TProjectIssueSyncEntityItem
) {
  // props
  const { project, entityConnection, isEnterprise } = props;

  // hooks
  const { resolvedTheme } = useTheme();
  const {
    entity: { deleteEntity },
  } = useGithubIntegration(isEnterprise);
  const { t } = useTranslation();

  // states
  const [editModal, setEditModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteLoader, setDeleteLoader] = useState<boolean>(false);

  // derived values
  const githubLogo = resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo;

  // handlers
  const handleEditOpen = () => setEditModal(true);

  const handleDeleteOpen = () => setDeleteModal(true);

  const handleDeleteClose = () => setDeleteModal(false);

  // TODO: Add toast notifications
  const handleDeleteModalSubmit = async () => {
    try {
      setDeleteLoader(true);
      await deleteEntity(entityConnection.id);
      setDeleteModal(false);
    } catch (error) {
      console.error("handleDeleteModalSubmit", error);
    } finally {
      setDeleteLoader(false);
    }
  };

  return (
    <>
      {/* entity edit */}

      {/* entity delete */}
      <ModalCore isOpen={deleteModal} handleClose={handleDeleteClose}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-heading-sm-medium text-secondary">
              {t("github_integration.remove_project_issue_sync")}
            </div>
            <div className="text-body-xs-regular text-tertiary">
              {t("github_integration.remove_project_issue_sync_confirmation")}
            </div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={handleDeleteClose} disabled={deleteLoader}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={handleDeleteModalSubmit} loading={deleteLoader} disabled={deleteLoader}>
              {deleteLoader ? t("common.processing") : t("common.remove")}
            </Button>
          </div>
        </div>
      </ModalCore>

      <EditProjectIssueSyncForm
        modal={editModal}
        handleModal={setEditModal}
        data={entityConnection}
        isEnterprise={isEnterprise}
      />

      <IntegrationsMapping
        entityName={`${entityConnection?.entity_data?.name} (${entityConnection?.entity_data?.full_name})`}
        project={project}
        connectorLogo={githubLogo}
        handleEditOpen={handleEditOpen}
        handleDeleteOpen={handleDeleteOpen}
        bidirectionalSync={entityConnection?.config?.allowBidirectionalSync}
      />
    </>
  );
});
