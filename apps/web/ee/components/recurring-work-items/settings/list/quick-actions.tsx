"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, ContextMenu, CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { cn, getCreateUpdateRecurringWorkItemSettingsPath } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { IRecurringWorkItemInstance } from "@/plane-web/store/recurring-work-items/instance";

type TRecurringWorkItemQuickActionsProps = {
  deleteRecurringWorkItem: (id: string) => Promise<void>;
  getRecurringWorkItemById: (id: string) => IRecurringWorkItemInstance | undefined;
  parentRef: React.RefObject<HTMLDivElement> | null;
  projectId: string;
  recurringWorkItemId: string;
  workspaceSlug: string;
};

export const RecurringWorkItemQuickActions = observer((props: TRecurringWorkItemQuickActionsProps) => {
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
      icon: Pencil,
      action: handleEditRecurringWorkItem,
      shouldRender: recurringWorkItem.canCurrentUserEdit,
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: t("common.actions.delete"),
      icon: Trash2,
      shouldRender: recurringWorkItem.canCurrentUserDelete,
      className: "text-red-500",
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
            <span className="font-medium text-custom-text-100">{recurringWorkItem.workitem_blueprint.name}</span>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item.action();
                }}
                className={cn(
                  "flex items-center gap-2",
                  {
                    "text-custom-text-400": item.disabled,
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
                      className={cn("text-custom-text-300 whitespace-pre-line", {
                        "text-custom-text-400": item.disabled,
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
