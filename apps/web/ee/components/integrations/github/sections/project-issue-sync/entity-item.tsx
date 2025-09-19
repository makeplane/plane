"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
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
import GithubDarkLogo from "@/public/services/github-dark.svg";
import GithubLightLogo from "@/public/services/github-light.svg";
import { IntegrationsMapping } from "../../../ui/integrations-mapping";
import { EditProjectIssueSyncForm } from "./form/edit";

type TProjectIssueSyncEntityItem = {
  project: IProject;
  entityConnection: TGithubEntityConnection;
  isEnterprise: boolean;
};

export const ProjectIssueSyncEntityItem: FC<TProjectIssueSyncEntityItem> = observer((props) => {
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
              {t("github_integration.remove_project_issue_sync")}
            </div>
            <div className="text-sm text-custom-text-300">
              {t("github_integration.remove_project_issue_sync_confirmation")}
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
