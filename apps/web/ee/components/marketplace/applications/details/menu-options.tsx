"use client";

import React, { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Edit, Key, Share, Trash2 } from "lucide-react";

// plane imports

import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles, TUserApplication } from "@plane/types";
import { PopoverMenu } from "@plane/ui";

// local imports

import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { ApplicationPublishModal, ApplicationTileMenuItem } from "@/plane-web/components/marketplace";

import { RegenerateClientSecretModal } from "../form/regenerate-client-secret-modal";
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

export const ApplicationTileMenuOptions: FC<ApplicationTileMenuOptionsProps> = observer((props) => {
  // hooks
  const { app } = props;
  const { t } = useTranslation();
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [isRevokeAccessModalOpen, setIsRevokeAccessModalOpen] = React.useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = React.useState(false);

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
      isActive: false,
      prependIcon: <Trash2 className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {},
    },
    {
      key: "uninstall",
      type: "menu-item",
      label: "Uninstall",
      isActive: app.is_installed && allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE),
      prependIcon: <Trash2 className="flex-shrink-0 h-3 w-3" />,
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
        buttonClassName="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 bg-custom-background-100 rounded-sm outline-none"
        keyExtractor={(item: TPopoverMenuOptions) => item.key}
        panelClassName="p-0 py-2 rounded-md border border-custom-border-200 bg-custom-background-100 space-y-1"
        render={(item: TPopoverMenuOptions) => <ApplicationTileMenuItem {...item} />}
      />
      <ApplicationPublishModal isOpen={isPublishModalOpen} handleClose={() => togglePublishModal(false)} app={app} />
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
