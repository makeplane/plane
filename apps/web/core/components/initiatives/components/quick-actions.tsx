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
import { ArchiveRestoreIcon, MoreHorizontal } from "lucide-react";
// plane imports
import { ARCHIVABLE_INITIATIVE_STATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { NewTabIcon, LinkIcon, EditIcon, TrashIcon, ArchiveIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// types
import type { TInitiative } from "@/types/initiative";
// local components
import { CreateUpdateInitiativeModal } from "./create-update-initiatives-modal";
import { InitiativeArchiveModal } from "./initiative-archive-modal";
import { InitiativeDeleteModal } from "./initiative-delete-modal";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  initiative: TInitiative;
  workspaceSlug: string;
  customClassName?: string;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

export const InitiativeQuickActions = observer(function InitiativeQuickActions(props: Props) {
  const { parentRef, initiative, workspaceSlug, customClassName, permissions } = props;
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // auth
  const { canEdit, canDelete } = permissions;
  // store hooks
  const {
    initiative: { restoreInitiative },
  } = useInitiatives();
  // derived values
  const isArchived = !!initiative?.archived_at;
  const isArchivable = ARCHIVABLE_INITIATIVE_STATES.includes(initiative.state);

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

  const handleEditInitiative = () => {
    setUpdateModal(true);
  };

  const handleArchiveInitiative = () => {
    setArchiveModal(true);
  };

  const handleDeleteInitiative = () => {
    setDeleteModal(true);
  };

  const handleRestoreInitiative = async () => {
    if (!workspaceSlug || !initiative.id) return;
    try {
      await restoreInitiative(workspaceSlug.toString(), initiative.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Restore success",
        message: `You can find ${initiative.name} in your initiatives.`,
      });
    } catch (_error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.restore.error"),
      });
    }
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: t("edit"),
      icon: EditIcon,
      action: handleEditInitiative,
      shouldRender: canEdit && !isArchived,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: NewTabIcon,
      shouldRender: !isArchived,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
      shouldRender: !isArchived,
    },
    {
      key: "archive",
      action: handleArchiveInitiative,
      title: t("archive"),
      description: isArchivable ? undefined : t("initiatives.archive_description"),
      icon: ArchiveIcon,
      className: "items-start",
      iconClassName: "mt-1 shrink-0",
      disabled: !isArchivable,
      shouldRender: canEdit && !isArchived,
      // shouldRender: canArchive && !isArchived, <permissionEngine> add archive permission check
    },
    {
      key: "restore",
      action: handleRestoreInitiative,
      title: t("restore"),
      icon: ArchiveRestoreIcon,
      // shouldRender: canRestore && isArchived, <permissionEngine> add restore permission check
      shouldRender: canEdit && isArchived,
    },
    {
      key: "delete",
      action: handleDeleteInitiative,
      title: t("delete"),
      icon: TrashIcon,
      shouldRender: canDelete,
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
          <InitiativeArchiveModal
            initiative={initiative}
            isOpen={archiveModal}
            handleClose={() => setArchiveModal(false)}
            workspaceSlug={workspaceSlug}
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
