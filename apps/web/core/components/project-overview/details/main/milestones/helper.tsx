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
// plane imports
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu, cn } from "@plane/ui";
// helper
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { CreateUpdateMilestoneModal } from "./create-update-modal";

export type TMilestoneWorkItemOperations = {
  copyText: (text: string) => void;
  update: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  removeRelation: (workspaceSlug: string, projectId: string, workItemId: string) => Promise<void>;
};

export const useMilestonesWorkItemOperations = (
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES,
  milestoneId: string
): TMilestoneWorkItemOperations => {
  const { updateIssue } = useIssueDetail(issueServiceType);
  const { removeWorkItemFromMilestone, updateMilestoneProgress } = useMilestones();

  const { t } = useTranslation();
  // derived values
  const entityName = issueServiceType === EIssueServiceType.ISSUES ? "Work item" : "Epic";

  const issueOperations: TMilestoneWorkItemOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}${text}`)
          .then(() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("common.link_copied"),
              message: t("entity.link_copied_to_clipboard", { entity: entityName }),
            });
            return;
          })
          .catch(() => {
            console.error("Failed to copy text");
          });
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          updateMilestoneProgress(projectId, milestoneId);
          setToast({
            title: t("toast.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("entity.update.success", { entity: entityName }),
          });
        } catch {
          setToast({
            title: t("toast.error"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: entityName }),
          });
        }
      },
      removeRelation: async (workspaceSlug: string, projectId: string, workItemId: string) => {
        try {
          return removeWorkItemFromMilestone(workspaceSlug, projectId, milestoneId, workItemId).then(() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Work item removed from milestone successfully",
            });
            return;
          });
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to remove work item from milestone",
          });
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entityName, removeWorkItemFromMilestone, updateIssue, milestoneId]
  );

  return issueOperations;
};

// Components
type MilestoneQuickActionButtonProps = {
  milestoneId: string;
  workspaceSlug: string;
  projectId: string;
};

export function MilestoneQuickActionButton(props: MilestoneQuickActionButtonProps) {
  const { milestoneId, workspaceSlug, projectId } = props;

  const [isCreateUpdateMilestoneModalOpen, setIsCreateUpdateMilestoneModalOpen] = useState(false);
  const { deleteMilestone } = useMilestones();

  const { t } = useTranslation();

  const handleDeleteMilestone = () => {
    const promise = deleteMilestone(workspaceSlug, projectId, milestoneId);

    setPromiseToast(promise, {
      success: {
        title: t("toast.success"),
        message: () => t("entity.delete.success", { entity: "Milestone" }),
      },
      error: {
        title: t("toast.error"),
        message: () => t("entity.delete.failed", { entity: "Milestone" }),
      },
    });
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => {
        setIsCreateUpdateMilestoneModalOpen(true);
      },
      title: t("common.actions.edit"),
      icon: EditIcon,
    },
    {
      key: "delete",
      action: () => {
        handleDeleteMilestone();
      },
      title: t("common.actions.delete"),
      icon: TrashIcon,
      iconClassName: "text-danger-primary",
    },
  ];

  return (
    <>
      <CreateUpdateMilestoneModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isCreateUpdateMilestoneModalOpen}
        handleClose={() => setIsCreateUpdateMilestoneModalOpen(false)}
        milestoneId={milestoneId}
      />
      <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.action();
            }}
            className="flex items-center gap-2"
            disabled={item.disabled}
          >
            {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
            {item.title}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
}
