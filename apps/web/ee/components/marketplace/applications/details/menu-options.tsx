"use client";

import React, { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Delete, Edit, Share } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TUserApplication } from "@plane/types";
import { PopoverMenu } from "@plane/ui";
// components
import { useWorkspace } from "@/hooks/store";
import { ApplicationPublishModal, ApplicationTileMenuItem } from "@/plane-web/components/marketplace";
// constants
// hooks

export type TPopoverMenuOptions = {
  key: string;
  type: string;
  label?: string | undefined;
  isActive?: boolean | undefined;
  prependIcon?: ReactNode | undefined;
  appendIcon?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
};

type ApplicationTileMenuOptionsProps = {
  app: TUserApplication;
};

export const ApplicationTileMenuOptions: FC<ApplicationTileMenuOptionsProps> = observer((props) => {
  // hooks
  const { app } = props;
  const { t } = useTranslation();
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { slug: workspaceSlug } = currentWorkspace || {};

  const togglePublishModal = (flag: boolean) => {
    setIsPublishModalOpen(flag);
  };

  const handleEdit = () => {
    router.push(`/${workspaceSlug}/settings/applications/${app.id}/edit`);
  };

  const popoverMenuOptions: TPopoverMenuOptions[] = [
    {
      key: "menu-edit",
      type: "menu-item",
      label: "Edit",
      isActive: true,
      prependIcon: <Edit className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {
        handleEdit();
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
      prependIcon: <Delete className="flex-shrink-0 h-3 w-3" />,
      onClick: () => {},
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
    </>
  );
});
