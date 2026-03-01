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
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EUserProjectRoles } from "@plane/types";
// ui
import type { TContextMenuItem } from "@plane/ui";
import { AlertModalCore, CustomMenu } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";
import { WorkflowChangeHistory } from "./change-history";

type Props = {
  projectId: string;
  workspaceSlug: string;
};

export const WorkflowSettingsQuickActions = observer(function WorkflowSettingsQuickActions(props: Props) {
  const { projectId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isResetWorkflowModalOpen, setIsResetWorkflowModalOpen] = useState(false);
  const [isResetWorkflowLoading, setIsResetWorkflowLoading] = useState(false);
  const [isChangeHistoryOpen, setIsChangeHistoryOpen] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { resetWorkflowStates } = useProjectState();
  // auth
  const hasAdminPermission = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const handleResetWorkflow = async () => {
    setIsResetWorkflowLoading(true);
    await resetWorkflowStates(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workflows.toasts.reset.success.title"),
          message: t("workflows.toasts.reset.success.message"),
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workflows.toasts.reset.error.title"),
          message: t("workflows.toasts.reset.error.message"),
        });
      })
      .finally(() => {
        setIsResetWorkflowLoading(false);
        setIsResetWorkflowModalOpen(false);
      });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "reset-workflow",
      title: t("workflows.quick_actions.reset_workflow"),
      action: () => {
        setIsResetWorkflowModalOpen(true);
      },
      shouldRender: hasAdminPermission,
    },
    {
      key: "view-change-history",
      title: t("workflows.quick_actions.view_change_history"),
      action: () => setIsChangeHistoryOpen(true),
      shouldRender: hasAdminPermission,
    },
  ];

  return (
    <>
      <WorkflowChangeHistory
        isOpen={isChangeHistoryOpen}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
        onClose={() => setIsChangeHistoryOpen(false)}
      />
      <AlertModalCore
        variant="danger"
        isOpen={isResetWorkflowModalOpen}
        handleClose={() => setIsResetWorkflowModalOpen(false)}
        handleSubmit={handleResetWorkflow}
        isSubmitting={isResetWorkflowLoading}
        title={t("workflows.confirmation_modals.reset_workflow.title")}
        content={t("workflows.confirmation_modals.reset_workflow.description")}
        primaryButtonText={{
          loading: t("common.confirming"),
          default: t("common.reset"),
        }}
        secondaryButtonText={t("common.cancel")}
      />
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
