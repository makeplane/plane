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
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IProject, TBitbucketEntityConnection } from "@plane/types";
import { ModalCore } from "@plane/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import { ProjectEntityItem } from "@/components/integrations/ui/project-entity-item";
import { EditPRStateMappingForm } from "./edit-form";

type TPRStateMappingEntityItem = {
  project: IProject;
  entityConnection: TBitbucketEntityConnection;
};

export const PRStateMappingEntityItem = observer(function PRStateMappingEntityItem({
  project,
  entityConnection,
}: TPRStateMappingEntityItem) {
  const {
    entity: { deleteEntity },
  } = useBitbucketDCIntegration();
  const { t } = useTranslation();

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoader, setDeleteLoader] = useState(false);

  const handleDeleteModalSubmit = async () => {
    try {
      setDeleteLoader(true);
      await deleteEntity(entityConnection.id);
      setDeleteModal(false);
    } catch (error) {
      console.error("PRStateMappingEntityItem.handleDelete", error);
    } finally {
      setDeleteLoader(false);
    }
  };

  return (
    <>
      <ModalCore isOpen={deleteModal} handleClose={() => setDeleteModal(false)}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-heading-sm-medium text-secondary">Remove PR State Mapping</div>
            <div className="text-body-xs-regular text-tertiary">
              Are you sure you want to remove this PR state mapping?
            </div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={() => setDeleteModal(false)} disabled={deleteLoader}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleDeleteModalSubmit()}
              loading={deleteLoader}
              disabled={deleteLoader}
            >
              {deleteLoader ? t("common.processing") : t("common.remove")}
            </Button>
          </div>
        </div>
      </ModalCore>

      <EditPRStateMappingForm modal={editModal} handleModal={setEditModal} data={entityConnection} />

      <ProjectEntityItem
        project={project}
        handleEditOpen={() => setEditModal(true)}
        handleDeleteOpen={() => setDeleteModal(true)}
      />
    </>
  );
});
