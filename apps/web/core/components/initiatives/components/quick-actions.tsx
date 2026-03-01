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
import { NewTabIcon, LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
import { MoreHorizontal } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EUserWorkspaceRoles } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
// Plane-web
import type { TInitiative } from "@/types/initiative";
// local components
import { CreateUpdateInitiativeModal } from "./create-update-initiatives-modal";
import { InitiativeDeleteModal } from "./initiative-delete-modal";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  initiative: TInitiative;
  workspaceSlug: string;
  disabled?: boolean;
  customClassName?: string;
};

export const InitiativeQuickActions = observer(function InitiativeQuickActions(props: Props) {
  const { parentRef, initiative, workspaceSlug, disabled = false, customClassName } = props;
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();

  // derived values

  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isOwnerOrAdmin = data?.id === initiative?.created_by || isAdmin;

  const { t } = useTranslation();

  const initiativeLink = `${workspaceSlug}/initiatives/${initiative?.id}`;
  const handleCopyText = () =>
    copyUrlToClipboard(initiativeLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("initiatives.toast.link_copied"),
      });
    });
  const handleOpenInNewTab = () => window.open(`/${initiativeLink}`, "_blank");

  const handleEditCycle = () => {
    setUpdateModal(true);
  };

  const handleDeleteCycle = () => {
    setDeleteModal(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: t("edit"),
      icon: EditIcon,
      action: handleEditCycle,
      shouldRender: !disabled,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: NewTabIcon,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
    },
    {
      key: "delete",
      action: handleDeleteCycle,
      title: t("delete"),
      icon: TrashIcon,
      shouldRender: !disabled && isOwnerOrAdmin,
    },
  ];

  return (
    <>
      {initiative && (
        <div className="fixed">
          <CreateUpdateInitiativeModal
            initiativeId={initiative?.id}
            isOpen={updateModal}
            handleClose={() => setUpdateModal(false)}
          />
          <InitiativeDeleteModal
            initiative={initiative}
            isOpen={deleteModal}
            handleClose={() => setDeleteModal(false)}
            workspaceSlug={workspaceSlug}
          />
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu
        customButton={<IconButton variant="tertiary" size="lg" icon={MoreHorizontal} />}
        placement="bottom-end"
        closeOnSelect
        buttonClassName={customClassName}
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-placeholder": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-tertiary whitespace-pre-line", {
                      "text-placeholder": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
