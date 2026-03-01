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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { NewTabIcon, LinkIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardDeleteModal } from "./modals/delete-modal";

type Props = {
  dashboardId: string;
  parentRef: React.RefObject<HTMLElement>;
  showEdit?: boolean;
  customClassName?: string;
};

export const DashboardQuickActions = observer(function DashboardQuickActions(props: Props) {
  const { dashboardId, parentRef, showEdit = true, customClassName } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: { deleteDashboard, toggleCreateUpdateModal, updateCreateUpdateModalPayload },
  } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { canCurrentUserDeleteDashboard, canCurrentUserEditDashboard, getRedirectionLink } = dashboardDetails ?? {};
  // translation
  const { t } = useTranslation();
  // menu items
  const MENU_ITEMS: TContextMenuItem[] = useMemo(() => {
    const dashboardLink = getRedirectionLink?.();
    return [
      {
        key: "edit",
        action: () => {
          toggleCreateUpdateModal(true);
          updateCreateUpdateModalPayload({ ...dashboardDetails?.asJSON, id: dashboardId });
        },
        title: t("common.actions.edit"),
        icon: EditIcon,
        shouldRender: !!canCurrentUserEditDashboard && showEdit,
      },
      {
        key: "open-in-new-tab",
        action: () => window.open(dashboardLink, "_blank"),
        title: t("common.actions.open_in_new_tab"),
        icon: NewTabIcon,
      },
      {
        key: "copy-link",
        action: () => {
          if (!dashboardLink) return;
          copyUrlToClipboard(dashboardLink).then(() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Link Copied!",
              message: "Page link copied to clipboard.",
            });
          });
        },
        title: t("common.actions.copy_link"),
        icon: LinkIcon,
      },
      {
        key: "delete",
        action: () => setIsDeleteModalOpen(true),
        title: t("common.actions.delete"),
        icon: TrashIcon,
        shouldRender: !!canCurrentUserDeleteDashboard,
      },
    ];
  }, [
    canCurrentUserDeleteDashboard,
    canCurrentUserEditDashboard,
    getRedirectionLink,
    dashboardDetails?.asJSON,
    dashboardId,
    toggleCreateUpdateModal,
    t,
    updateCreateUpdateModalPayload,
  ]);

  return (
    <>
      <DashboardDeleteModal
        dashboardId={dashboardId}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleDelete={async () => await deleteDashboard(dashboardId)}
        isOpen={isDeleteModalOpen}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <CustomMenu
        placement="bottom-end"
        optionsClassName="max-h-[90vh]"
        buttonClassName={customClassName}
        ellipsis
        closeOnSelect
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action?.();
              }}
              className={cn("flex items-center gap-2", item.className)}
              disabled={item.disabled}
            >
              {item.customContent ?? (
                <>
                  {item.icon && <item.icon className="size-3" />}
                  {item.title}
                </>
              )}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
