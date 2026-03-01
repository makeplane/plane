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

import type { FC, ReactNode } from "react";
import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Edit, Key, Share } from "lucide-react";
import { TrashIcon } from "@plane/propel/icons";

// plane imports

import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TUserApplication } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
import { PopoverMenu } from "@plane/ui";

// local imports

import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { ApplicationPublishModal, ApplicationTileMenuItem } from "@/components/marketplace";

import { RegenerateClientSecretModal } from "../form/regenerate-client-secret-modal";
import { DeleteApplicationModal } from "./delete-modal";
import { RevokeAccessModal } from "./revoke-modal";

export type TPopoverMenuOptions = {
  key: string;
  type: string;
  label?: string | undefined;
  isActive?: boolean | undefined;
  prependIcon?: ReactNode | undefined;
  appendIcon?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
  isDanger?: boolean | undefined;
};

type ApplicationTileMenuOptionsProps = {
  app: TUserApplication;
};

export const ApplicationTileMenuOptions = observer(function ApplicationTileMenuOptions(
  props: ApplicationTileMenuOptionsProps
) {
  // hooks
  const { app } = props;
  const { t } = useTranslation();
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [isRevokeAccessModalOpen, setIsRevokeAccessModalOpen] = React.useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = React.useState(false);
  const [isDeleteApplicationModalOpen, setIsDeleteApplicationModalOpen] = React.useState(false);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { slug: workspaceSlug } = currentWorkspace || {};

  const togglePublishModal = (flag: boolean) => {
    setIsPublishModalOpen(flag);
  };

  const toggleRevokeAccessModal = (flag: boolean) => {
    setIsRevokeAccessModalOpen(flag);
  };

  const toggleCredentialsModal = (flag: boolean) => {
    setIsCredentialsModalOpen(flag);
  };

  const toggleDeleteApplicationModal = (flag: boolean) => {
    setIsDeleteApplicationModalOpen(flag);
  };

  const handleEdit = () => {
    router.push(`/${workspaceSlug}/settings/integrations/${app.slug}/edit`);
  };

  const popoverMenuOptions: TPopoverMenuOptions[] = [
    {
      key: "menu-edit",
      type: "menu-item",
      label: "Edit",
      isActive: app.is_owned,
      prependIcon: <Edit className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {
        handleEdit();
      },
    },
    {
      key: "menu-credentials",
      type: "menu-item",
      label: "App credentials",
      isActive: app.is_owned && Boolean(app.client_id) && Boolean(app.client_secret),
      prependIcon: <Key className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {
        toggleCredentialsModal(true);
      },
    },
    {
      key: "menu-publish",
      type: "menu-item",
      label: "Publish to marketplace",
      isActive: false,
      prependIcon: <Share className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {
        togglePublishModal(true);
      },
    },
    {
      key: "menu-delete",
      type: "menu-item",
      label: "Delete",
      isActive: app.is_owned,
      prependIcon: <TrashIcon className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {
        toggleDeleteApplicationModal(true);
      },
    },
    {
      key: "uninstall",
      type: "menu-item",
      label: "Uninstall",
      isActive: app.is_installed && allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE),
      prependIcon: <TrashIcon className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {
        toggleRevokeAccessModal(true);
      },
      isDanger: true,
    },
  ];

  return (
    <>
      <PopoverMenu
        data={popoverMenuOptions}
        buttonClassName="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-layer-1 bg-surface-1 rounded-sm outline-none"
        keyExtractor={(item: TPopoverMenuOptions) => item.key}
        panelClassName="p-0 py-2 rounded-md border border-subtle bg-surface-1 space-y-1"
        render={(item: TPopoverMenuOptions) => <ApplicationTileMenuItem {...item} />}
      />
      <ApplicationPublishModal isOpen={isPublishModalOpen} handleClose={() => togglePublishModal(false)} app={app} />
      <DeleteApplicationModal
        app={app}
        isOpen={isDeleteApplicationModalOpen}
        handleClose={() => toggleDeleteApplicationModal(false)}
      />
      <RevokeAccessModal
        app={app}
        isOpen={isRevokeAccessModalOpen}
        handleClose={() => toggleRevokeAccessModal(false)}
      />

      <RegenerateClientSecretModal
        application={app}
        isOpen={isCredentialsModalOpen}
        handleClose={() => setIsCredentialsModalOpen(false)}
      />
    </>
  );
});
