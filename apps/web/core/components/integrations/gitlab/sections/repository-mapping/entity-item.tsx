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

import type { ReactElement } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
// plane web components
import { EConnectionType } from "@plane/etl/gitlab";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TGitlabEntityConnection } from "@plane/types";
import { ModalCore } from "@plane/ui";
// assets
import GitlabLogo from "@/app/assets/services/gitlab.svg?url";
import { FormEdit } from "@/components/integrations/gitlab";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types

type TEntityConnectionItem = {
  entityConnection: TGitlabEntityConnection;
  isEnterprise: boolean;
};

export const EntityConnectionItem = observer(function EntityConnectionItem(props: TEntityConnectionItem) {
  // props
  const { entityConnection, isEnterprise } = props;
  const { t } = useTranslation();

  // hooks
  const {
    getProjectById,
    entityConnection: { deleteEntityConnection },
  } = useGitlabIntegration(isEnterprise);

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
    } catch (error) {
      console.error("handleDeleteModalSubmit", error);
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
      return <img src={GitlabLogo} alt="Gitlab Logo" className="w-full h-full object-cover" />;
    }
    return <></>;
  };

  return (
    <>
      {/* entity delete */}
      <ModalCore isOpen={deleteModal} handleClose={handleDeleteClose}>
        <div className="space-y-5 p-5">
          <div className="space-y-2">
            <div className="text-heading-sm-medium text-secondary">{t("gitlab_integration.remove_connection")}</div>
            <div className="text-body-xs-regular text-tertiary">
              {t("gitlab_integration.remove_connection_confirmation")}
            </div>
          </div>
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={handleDeleteClose} disabled={deleteLoader}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={handleDeleteModalSubmit} loading={deleteLoader} disabled={deleteLoader}>
              {deleteLoader ? t("common.processing") : t("common.continue")}
            </Button>
          </div>
        </div>
      </ModalCore>

      {/* entity edit */}
      <FormEdit modal={editModal} handleModal={setEditModal} data={entityConnection} isEnterprise={isEnterprise} />

      <div className="relative flex items-center gap-2 p-2 bg-layer-2">
        <div className="flex-shrink-0 relative flex justify-center items-center w-8 h-8 rounded-md">
          {getEntityLogo(entityConnection)}
        </div>
        <div className="w-full">
          <div className="text-body-xs-medium">{getEntityName(entityConnection)}</div>
        </div>
        <div className="relative flex items-center gap-2">
          {entityConnection.type === EConnectionType.PLANE_PROJECT && (
            <Button variant="secondary" onClick={handleEditOpen}>
              {t("common.edit")}
            </Button>
          )}
          <Button variant="error-outline" onClick={handleDeleteOpen}>
            {t("remove")}
          </Button>
        </div>
      </div>
    </>
  );
});
