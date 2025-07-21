"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import { IProject } from "@plane/types";
import { Button, ModalCore } from "@plane/ui";
// plane web components
import { FormEdit } from "@/plane-web/components/integrations/github";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TGithubEntityConnection } from "@/plane-web/types/integrations";
// public images
import GithubDarkLogo from "@/public/services/github-dark.svg";
import GithubLightLogo from "@/public/services/github-light.svg";
import { IntegrationsMapping } from "../../../ui/integrations-mapping";

type TEntityConnectionItem = {
  project: IProject;
  entityConnection: TGithubEntityConnection;
  isEnterprise: boolean;
};

export const EntityConnectionItem: FC<TEntityConnectionItem> = observer((props) => {
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
            <div className="text-xl font-medium text-custom-text-200">{t("github_integration.remove_entity")}</div>
            <div className="text-sm text-custom-text-300">{t("github_integration.remove_entity_confirmation")}</div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleDeleteClose} disabled={deleteLoader}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeleteModalSubmit}
              loading={deleteLoader}
              disabled={deleteLoader}
            >
              {deleteLoader ? "Processing" : "Continue"}
            </Button>
          </div>
        </div>
      </ModalCore>

      <FormEdit modal={editModal} handleModal={setEditModal} data={entityConnection} isEnterprise={isEnterprise} />

      <IntegrationsMapping
        entityName={`${entityConnection?.entity_data?.name} (${entityConnection?.entity_data?.full_name})`}
        project={project}
        connectorLogo={githubLogo}
        handleEditOpen={handleEditOpen}
        handleDeleteOpen={handleDeleteOpen}
      />
    </>
  );
});
