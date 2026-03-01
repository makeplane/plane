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
// icons

import { EditIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { AlertModalCore, ContextMenu, CustomMenu } from "@plane/ui";
import { cn, getCreateUpdateRecurringWorkItemSettingsPath } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import type { IRecurringWorkItemInstance } from "@/store/recurring-work-items/instance";

type TRecurringWorkItemQuickActionsProps = {
  deleteRecurringWorkItem: (id: string) => Promise<void>;
  getRecurringWorkItemById: (id: string) => IRecurringWorkItemInstance | undefined;
  parentRef: React.RefObject<HTMLDivElement> | null;
  projectId: string;
  recurringWorkItemId: string;
  workspaceSlug: string;
};

export const RecurringWorkItemQuickActions = observer(function RecurringWorkItemQuickActions(
  props: TRecurringWorkItemQuickActionsProps
) {
  const {
    deleteRecurringWorkItem,
    getRecurringWorkItemById,
    parentRef,
    projectId,
    recurringWorkItemId,
    workspaceSlug,
  } = props;
  // router
  const router = useAppRouter();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const recurringWorkItem = getRecurringWorkItemById(recurringWorkItemId);
  const isAnyActionAllowed = recurringWorkItem?.canCurrentUserEdit || recurringWorkItem?.canCurrentUserDelete;
  if (!recurringWorkItem || !isAnyActionAllowed) return null;

  const handleEditRecurringWorkItem = () => {
    router.push(getCreateUpdateRecurringWorkItemSettingsPath({ workspaceSlug, projectId, recurringWorkItemId }));
  };

  const handleRecurringWorkItemDeletion = async () => {
    if (!workspaceSlug || !recurringWorkItem.id) return;

    setIsDeleteLoading(true);
    await deleteRecurringWorkItem(recurringWorkItem.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("recurring_work_items.toasts.delete.success.title"),
          message: t("recurring_work_items.toasts.delete.success.message", {
            name: recurringWorkItem.workitem_blueprint.name,
          }),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("recurring_work_items.toasts.delete.error.title"),
          message: t("recurring_work_items.toasts.delete.error.message"),
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: t("common.actions.edit"),
      icon: EditIcon,
      action: handleEditRecurringWorkItem,
      shouldRender: recurringWorkItem.canCurrentUserEdit,
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: t("common.actions.delete"),
      icon: TrashIcon,
      shouldRender: recurringWorkItem.canCurrentUserDelete,
      className: "text-danger-primary",
    },
  ];

  return (
    <>
      <AlertModalCore
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleRecurringWorkItemDeletion}
        isSubmitting={isDeleteLoading}
        isOpen={isDeleteModalOpen}
        title={t("recurring_work_items.delete_confirmation.title")}
        content={
          <>
            {t("recurring_work_items.delete_confirmation.description.prefix")}
            <span className="font-medium text-primary">{recurringWorkItem.workitem_blueprint.name}</span>
            {t("recurring_work_items.delete_confirmation.description.suffix")}
          </>
        }
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <div className="flex flex-col gap-2">
        <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
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
      </div>
    </>
  );
});
