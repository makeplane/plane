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
import { MoreHorizontal } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EditIcon, LinkIcon, NewTabIcon, TrashIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// types
import type { TTeamspaceItemPermissions } from "@/store/teamspace/permissions/root";
// plane web constants
import { DeleteTeamspaceModal } from "@/components/teamspaces/actions/delete-modal";

type Props = {
  teamspaceId: string;
  workspaceSlug: string;
  parentRef: React.RefObject<HTMLDivElement> | null;
  permissions: Pick<TTeamspaceItemPermissions, "canEdit" | "canDelete">;
  buttonClassName?: string;
};

export const TeamQuickActions = observer(function TeamQuickActions(props: Props) {
  const { teamspaceId, workspaceSlug, parentRef, permissions, buttonClassName } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  // derived values
  const teamLink = `${workspaceSlug}/teamspaces/${teamspaceId}`;

  const handleEditTeam = () => {
    toggleCreateTeamspaceModal({ isOpen: true, teamspaceId });
  };

  const handleOpenInNewTab: () => void = () => window.open(`/${teamLink}`, "_blank");

  const handleCopyText = async () => {
    try {
      await copyUrlToClipboard(teamLink);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("common.link_copied_to_clipboard"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.link_copy_failed"),
      });
    }
  };

  const handleDeleteTeam = () => {
    setIsDeleteModalOpen(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: EditIcon,
      action: handleEditTeam,
      shouldRender: permissions.canEdit,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in a new tab",
      icon: NewTabIcon,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link to teamspace",
      icon: LinkIcon,
      iconClassName: "",
    },
    {
      key: "delete",
      action: handleDeleteTeam,
      title: "Delete",
      icon: TrashIcon,
      shouldRender: permissions.canDelete,
      className: "text-danger-primary",
    },
  ];

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    action: () => {
      item.action();
    },
  }));

  return (
    <>
      <DeleteTeamspaceModal
        teamspaceId={teamspaceId}
        isModalOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />}
      <CustomMenu
        customButton={<IconButton variant="tertiary" size="lg" icon={MoreHorizontal} />}
        placement="bottom-end"
        closeOnSelect
        buttonClassName={buttonClassName}
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
