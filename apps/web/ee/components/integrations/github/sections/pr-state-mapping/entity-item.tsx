"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { GITHUB_INTEGRATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IProject, TGithubEntityConnection } from "@plane/types";
import { Button, ModalCore } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
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

export const PRStateMappingEntityItem: FC<TPRStateMappingEntityItem> = observer((props) => {
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
      captureSuccess({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.delete_entity_connection,
        payload: {
          id: entityConnection.id,
        },
      });
      setDeleteModal(false);
    } catch (error) {
      console.error("handleDeleteModalSubmit", error);
      captureError({
        eventName: GITHUB_INTEGRATION_TRACKER_EVENTS.delete_entity_connection,
        payload: {
          id: entityConnection.id,
        },
      });
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
            <div className="text-xl font-medium text-custom-text-200">
              {t("github_integration.remove_pr_state_mapping")}
            </div>
            <div className="text-sm text-custom-text-300">
              {t("github_integration.remove_pr_state_mapping_confirmation")}
            </div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleDeleteClose} disabled={deleteLoader}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteModalSubmit}
              loading={deleteLoader}
              disabled={deleteLoader}
            >
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
