"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// icons
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomMenu, TContextMenuItem, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { DeleteAutomationModal } from "../modals/delete-modal";

type TAutomationQuickActionsProps = {
  automationId: string;
  deleteAutomation: (automationId: string) => Promise<void>;
};

type TAutomationQuickActionsMenuItem = TContextMenuItem & {
  tooltipContent?: React.ReactNode;
};

export const AutomationQuickActions = observer((props: TAutomationQuickActionsProps) => {
  const { automationId, deleteAutomation } = props;
  // router
  const router = useAppRouter();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    getAutomationById,
    projectAutomations: { setCreateUpdateModalConfig },
  } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const isAnyActionAllowed = automation?.canCurrentUserEdit || automation?.canCurrentUserDelete;
  if (!automation || !isAnyActionAllowed) return null;

  const handleAutomationDeletion = async () => {
    if (!automation.id) return;
    await deleteAutomation(automation.id).then(() => {
      setIsDeleteModalOpen(false);
      router.push(automation.settingsLink);
    });
  };

  const MENU_ITEMS: TAutomationQuickActionsMenuItem[] = [
    {
      key: "edit",
      action: () => {
        setCreateUpdateModalConfig({ isOpen: true, payload: automation.asJSON });
      },
      title: t("common.actions.edit"),
      icon: Pencil,
      shouldRender: automation.canCurrentUserEdit,
    },
    {
      key: "delete",
      action: () => setIsDeleteModalOpen(true),
      title: t("common.actions.delete"),
      icon: Trash2,
      shouldRender: automation.canCurrentUserDelete,
      disabled: automation.isDeleteDisabled,
      className: automation.isDeleteDisabled ? "text-custom-text-400 cursor-not-allowed" : "text-red-500",
      tooltipContent: automation.isDeleteDisabled ? t("automations.delete.validation.enabled") : undefined,
    },
  ];

  return (
    <>
      <DeleteAutomationModal
        automationId={automationId}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleDelete={handleAutomationDeletion}
        isOpen={isDeleteModalOpen}
      />
      <div className="flex flex-col gap-2">
        <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
          {MENU_ITEMS.map((item) => {
            if (item.shouldRender === false) return null;
            return (
              <Tooltip
                key={item.key}
                tooltipContent={item.tooltipContent}
                position="left"
                disabled={!item.tooltipContent}
              >
                <span>
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
                </span>
              </Tooltip>
            );
          })}
        </CustomMenu>
      </div>
    </>
  );
});
