"use client";

import { FC, ReactElement, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// plane web components
import { GITLAB_INTEGRATION_TRACKER_EVENTS, GITLAB_INTEGRATION_TRACKER_ELEMENTS } from "@plane/constants";
import { EConnectionType } from "@plane/etl/gitlab";
import { useTranslation } from "@plane/i18n";
import { Button, ModalCore } from "@plane/ui";
import { Logo } from "@/components/common/logo";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { FormEdit } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TGitlabEntityConnection } from "@/plane-web/types/integrations/gitlab";
// public images
import GitlabLogo from "@/public/services/gitlab.svg";

type TEntityConnectionItem = {
  entityConnection: TGitlabEntityConnection;
};

export const EntityConnectionItem: FC<TEntityConnectionItem> = observer((props) => {
  // props
  const { entityConnection } = props;
  const { t } = useTranslation();

  // hooks
  const {
    getProjectById,
    entityConnection: { deleteEntityConnection },
  } = useGitlabIntegration();

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
      await deleteEntityConnection(entityConnection.id);
      setDeleteModal(false);
      captureSuccess({
        eventName: GITLAB_INTEGRATION_TRACKER_EVENTS.delete_entity_connection,
        payload: {
          entityConnectionId: entityConnection.id,
        },
      });
    } catch (error) {
      console.error("handleDeleteModalSubmit", error);
      captureError({
        eventName: GITLAB_INTEGRATION_TRACKER_EVENTS.delete_entity_connection,
        error: error as Error,
      });
    } finally {
      setDeleteLoader(false);
    }
  };

  const getEntityName = (entityconnection: TGitlabEntityConnection): string => {
    if (entityconnection.type === EConnectionType.PLANE_PROJECT) {
      return getProjectById(entityconnection.project_id!)?.name || "";
    } else if (entityconnection.type === EConnectionType.ENTITY) {
      return entityconnection.entity_slug!;
    }
    return "";
  };

  const getEntityLogo = (entityconnection: TGitlabEntityConnection): ReactElement => {
    if (entityconnection.type === EConnectionType.PLANE_PROJECT) {
      const project = getProjectById(entityconnection.project_id!);
      if (!project) return <></>;
      return <Logo logo={project.logo_props} size={14} />;
    } else if (entityconnection.type === EConnectionType.ENTITY) {
      return <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />;
    }
    return <></>;
  };

  return (
    <>
      {/* entity delete */}
      <ModalCore isOpen={deleteModal} handleClose={handleDeleteClose}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-xl font-medium text-custom-text-200">{t("gitlab_integration.remove_connection")}</div>
            <div className="text-sm text-custom-text-300">{t("gitlab_integration.remove_connection_confirmation")}</div>
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
              {deleteLoader ? t("common.processing") : t("common.continue")}
            </Button>
          </div>
        </div>
      </ModalCore>

      {/* entity edit */}
      <FormEdit modal={editModal} handleModal={setEditModal} data={entityConnection} />

      <div className="relative flex items-center gap-2 p-2 bg-custom-background-90/20">
        <div className="flex-shrink-0 relative flex justify-center items-center w-8 h-8 rounded">
          {getEntityLogo(entityConnection)}
        </div>
        <div className="w-full">
          <div className="text-sm font-medium">{getEntityName(entityConnection)}</div>
        </div>
        <div className="relative flex items-center gap-2">
          {entityConnection.type === EConnectionType.PLANE_PROJECT && (
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={handleEditOpen}
              data-ph-element={GITLAB_INTEGRATION_TRACKER_ELEMENTS.GITLAB_MAPPING_ENTITY_ITEM_BUTTON}
            >
              {t("common.edit")}
            </Button>
          )}
          <Button
            variant="link-danger"
            size="sm"
            onClick={handleDeleteOpen}
            data-ph-element={GITLAB_INTEGRATION_TRACKER_ELEMENTS.GITLAB_MAPPING_ENTITY_ITEM_BUTTON}
          >
            {t("remove")}
          </Button>
        </div>
      </div>
    </>
  );
});
