/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { MoreHorizontal } from "lucide-react";
// types
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { getIconButtonStyling } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView } from "@plane/types";
// ui
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// helpers
import { useViewMenuItems } from "@/components/common/quick-actions-helper";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { PublishViewModal, useViewPublish } from "@/plane-web/components/views/publish";
// local imports
import { DeleteProjectViewModal } from "./delete-view-modal";
import { CreateUpdateProjectViewModal } from "./modal";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  projectId: string;
  view: IProjectView;
  workspaceSlug: string;
  customClassName?: string;
};

export const ViewQuickActions = observer(function ViewQuickActions(props: Props) {
  const { parentRef, projectId, view, workspaceSlug, customClassName } = props;
  const { t } = useTranslation();
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // auth
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  // Publishing is an admin-only action on the server; only surface it to admins
  // so the entry never leads to a guaranteed 403 for a non-admin owner.
  const { isPublishModalOpen, setPublishModalOpen, publishContextMenu } = useViewPublish(!!view.anchor, isAdmin);

  const viewLink = `${workspaceSlug}/projects/${projectId}/views/${view.id}`;
  const handleCopyText = () =>
    // eslint-disable-next-line promise/always-return -- pre-existing, unrelated to nested-button fix
    copyUrlToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");

  const menuResult = useViewMenuItems({
    isOwner,
    isAdmin,
    workspaceSlug,
    projectId,
    view,
    handleEdit: () => setCreateUpdateViewModal(true),
    handleDelete: () => setDeleteViewModal(true),
    handleCopyLink: handleCopyText,
    handleOpenInNewTab,
  });

  // Handle both CE (array) and EE (object) return types
  const MENU_ITEMS: TContextMenuItem[] = Array.isArray(menuResult) ? menuResult : menuResult.items;
  const additionalModals = Array.isArray(menuResult) ? null : menuResult.modals;

  if (publishContextMenu) MENU_ITEMS.splice(2, 0, publishContextMenu);

  const CONTEXT_MENU_ITEMS = MENU_ITEMS.map(function CONTEXT_MENU_ITEMS(item) {
    return {
      ...item,
      action: () => {
        item.action();
      },
    };
  });

  return (
    <>
      <CreateUpdateProjectViewModal
        isOpen={createUpdateViewModal}
        onClose={() => setCreateUpdateViewModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        data={view}
      />
      <DeleteProjectViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <PublishViewModal isOpen={isPublishModalOpen} onClose={() => setPublishModalOpen(false)} view={view} />
      {additionalModals}
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu
        ariaLabel={t("aria_labels.quick_actions.view")}
        customButton={<MoreHorizontal className="size-4" />}
        customButtonClassName={getIconButtonStyling("tertiary", "lg")}
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
                    className={cn("whitespace-pre-line text-tertiary", {
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
