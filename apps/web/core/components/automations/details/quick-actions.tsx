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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
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

export const AutomationQuickActions = observer(function AutomationQuickActions(props: TAutomationQuickActionsProps) {
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
      icon: EditIcon,
      shouldRender: automation.canCurrentUserEdit,
    },
    {
      key: "delete",
      action: () => {
        setIsDeleteModalOpen(true);
      },
      title: t("common.actions.delete"),
      icon: TrashIcon,
      shouldRender: automation.canCurrentUserDelete,
      disabled: automation.isDeleteDisabled,
      className: automation.isDeleteDisabled ? "text-placeholder cursor-not-allowed" : "text-danger-primary",
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
                </span>
              </Tooltip>
            );
          })}
        </CustomMenu>
      </div>
    </>
  );
});
