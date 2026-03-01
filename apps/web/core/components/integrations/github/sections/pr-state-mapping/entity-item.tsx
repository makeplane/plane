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
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IProject, TGithubEntityConnection } from "@plane/types";
import { ModalCore } from "@plane/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
// public images
import { ProjectEntityItem } from "../../../ui/project-entity-item";
import { EditPRStateMappingForm } from "./form/edit";

type TPRStateMappingEntityItem = {
  project: IProject;
  entityConnection: TGithubEntityConnection;
  isEnterprise: boolean;
};

export const PRStateMappingEntityItem = observer(function PRStateMappingEntityItem(props: TPRStateMappingEntityItem) {
  // props
  const { project, entityConnection, isEnterprise } = props;

  // hooks
  const {
    entity: { deleteEntity },
  } = useGithubIntegration(isEnterprise);
  const { t } = useTranslation();

  // states
  const [editModal, setEditModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteLoader, setDeleteLoader] = useState<boolean>(false);

  // handlers
  const handleEditOpen = () => setEditModal(true);

  const handleDeleteOpen = () => setDeleteModal(true);

  const handleDeleteClose = () => setDeleteModal(false);

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
              {t("github_integration.remove_pr_state_mapping")}
            </div>
            <div className="text-body-xs-regular text-tertiary">
              {t("github_integration.remove_pr_state_mapping_confirmation")}
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

      <EditPRStateMappingForm
        modal={editModal}
        handleModal={setEditModal}
        data={entityConnection}
        isEnterprise={isEnterprise}
      />

      <ProjectEntityItem project={project} handleEditOpen={handleEditOpen} handleDeleteOpen={handleDeleteOpen} />
    </>
  );
});
