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
import { CloseIcon, PencilLeftIcon } from "@plane/propel/icons";
import { Menu } from "@plane/propel/menu";
import { Switch } from "@plane/propel/switch";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/propel/utils";
import type { TContextMenuItem } from "@plane/ui";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueType } from "@/plane-web/hooks/store";
import { useIntakeTypeForms } from "@/plane-web/hooks/store/use-intake-type-forms";
import { RenewModal } from "../renew-modal";
import { TypeFormCreateUpdateRoot } from "./create-update-form";
import { IntakeFormLink } from "./form-link";

type Props = {
  formId: string;
  projectId: string;
  workspaceSlug: string;
};
export const TypeFormListItem = observer(function TypeFormListItem(props: Props) {
  // props
  const { formId, projectId, workspaceSlug } = props;
  // states
  const [isEditing, setEditing] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  // hooks
  const { getTypeFormById, deleteTypeForm, updateTypeForm, regenerateFormAnchor } = useIntakeTypeForms();

  // handlers
  const handleRemove = () => {
    const deletePromise = deleteTypeForm(workspaceSlug, projectId, formId);
    setPromiseToast(deletePromise, {
      loading: "Deleting intake form",
      success: {
        title: "Success!",
        message: () => "Deleted intake form successfully",
      },
      error: {
        title: "Error!",
        message: () => "Failed to delete intake form",
      },
    });
  };

  // derived values
  const typeFormDetails = getTypeFormById(projectId, formId);
  const workItemType = useIssueType(typeFormDetails?.work_item_type);

  const QUICK_ACTIONS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: PencilLeftIcon,
      action: () => setEditing(true),
    },
    {
      key: "remove",
      title: "Remove",
      icon: CloseIcon,
      action: handleRemove,
      className: "text-danger-primary",
    },
  ];

  // handlers
  const handleToggleActive = (value: boolean) => {
    const togglePromise = updateTypeForm(projectId, formId, { is_active: value });
    setPromiseToast(togglePromise, {
      loading: "Updating form status",
      success: {
        title: "Success!",
        message: () => (value ? "Intake form enabled successfully" : "Intake form disabled successfully"),
      },
      error: {
        title: "Error!",
        message: () => (value ? "Failed to enable intake form" : "Failed to disable intake form"),
      },
    });
  };

  const renewIntakeForm = async (workspaceSlug: string, projectId: string) => {
    await regenerateFormAnchor(workspaceSlug, projectId, formId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to renew intake form",
      });
    });
  };

  if (!typeFormDetails || !workItemType || !workItemType.id) return null;

  return isEditing ? (
    <TypeFormCreateUpdateRoot
      typeId={typeFormDetails.work_item_type}
      data={typeFormDetails}
      handleRemove={handleRemove}
      onClose={() => setEditing(false)}
    />
  ) : (
    <>
      <div className="p-3 bg-surface-1 rounded-md border border-subtle space-y-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <span className="text-14 text-secondary font-medium">{typeFormDetails.name}</span>
            <div className="p-1  border border-subtle-1 rounded-md flex items-center gap-2">
              <IssueTypeIdentifier issueTypeId={workItemType.id} size={"xs"} />
              <span className="text-secondary text-11">{workItemType.name}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 items-center">
              <Switch value={typeFormDetails.is_active} onChange={handleToggleActive} />
            </div>
            {/* Quick actions */}
            <Menu ellipsis>
              {QUICK_ACTIONS.map((item) => (
                <Menu.MenuItem
                  key={item.key}
                  onClick={item.action}
                  className={cn("flex items-center gap-2 text-secondary", item.className)}
                >
                  {item.icon && <item.icon className="size-4" />}
                  <span className=" text-11">{item.title}</span>
                </Menu.MenuItem>
              ))}
            </Menu>
          </div>
        </div>
        {typeFormDetails.anchor && typeFormDetails.is_active && (
          <IntakeFormLink anchor={typeFormDetails.anchor} handleRenew={() => setIsRenewModalOpen(true)} />
        )}
      </div>
      {workspaceSlug && projectId && (
        <RenewModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          source="intake"
          handleSubmit={renewIntakeForm}
        />
      )}
    </>
  );
});
