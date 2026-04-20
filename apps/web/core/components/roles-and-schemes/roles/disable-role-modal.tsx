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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { PermissionNamespace } from "@plane/types";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  roleId: string | null;
  namespace: PermissionNamespace;
};

export const DisableRoleModal = observer(function DisableRoleModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, roleId, namespace } = props;
  // states
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getRoleDetailsByRoleId, getWorkspaceRolesByWorkspaceSlug, getProjectRolesByWorkspaceSlug, disableRole } =
    useRoleManagement();

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedRoleId(null);
    }
  }, [isOpen]);

  const roleDetails = roleId ? getRoleDetailsByRoleId(roleId) : undefined;
  const roleName = roleDetails?.name ?? "";
  const memberCount = roleDetails?.member_count ?? 0;
  const hasMembersToReassign = memberCount > 0;

  const reassignmentRoles = (
    namespace === "workspace"
      ? getWorkspaceRolesByWorkspaceSlug(workspaceSlug, "active")
      : getProjectRolesByWorkspaceSlug(workspaceSlug, "active")
  ).filter((role) => role.id !== roleId);

  const selectedRole = selectedRoleId ? getRoleDetailsByRoleId(selectedRoleId) : undefined;

  const isSubmitDisabled = hasMembersToReassign && !selectedRoleId;

  const handleDisable = async () => {
    if (!roleId) return;
    onClose();
    try {
      await disableRole({
        workspaceSlug,
        roleId,
        reassignTo: selectedRoleId ?? undefined,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("workspace_settings.settings.roles_and_schemes.disable_role.success_toast_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.disable_role.error_toast_description"),
      });
    }
  };

  if (!roleId) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h4 className="text-h4-medium text-secondary">
          {t("workspace_settings.settings.roles_and_schemes.disable_role.confirm_title", { roleName })}
        </h4>
        <IconButton icon={CloseIcon} variant="ghost" onClick={onClose} />
      </div>
      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <p className="text-body-sm-regular text-secondary">
          {hasMembersToReassign
            ? t("workspace_settings.settings.roles_and_schemes.disable_role.has_members_message", {
                memberCount,
              })
            : t("workspace_settings.settings.roles_and_schemes.disable_role.no_members_message")}
        </p>
        {hasMembersToReassign && (
          <div className="flex flex-col gap-y-2">
            <label htmlFor="reassignRole" className="text-body-sm-medium text-secondary">
              {t("workspace_settings.settings.roles_and_schemes.disable_role.reassign_label")}
              <span className="text-danger-secondary ml-1">*</span>
            </label>
            <CustomSelect
              value={selectedRoleId}
              label={
                <span className={`text-13 ${!selectedRole ? "text-placeholder" : ""}`}>
                  {selectedRole?.name ??
                    t("workspace_settings.settings.roles_and_schemes.disable_role.reassign_placeholder")}
                </span>
              }
              onChange={(val: string) => setSelectedRoleId(val)}
              className="grow w-full"
              buttonClassName="border-[0.5px] border-strong"
              input
            >
              {reassignmentRoles.map((role) => (
                <CustomSelect.Option key={role.id} value={role.id}>
                  {role.name}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-subtle px-5 py-4">
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="error-fill" onClick={handleDisable} disabled={isSubmitDisabled}>
          {hasMembersToReassign
            ? t("workspace_settings.settings.roles_and_schemes.disable_role.submit_button")
            : t("workspace_settings.settings.roles_and_schemes.disable_role.submit_button_no_members")}
        </Button>
      </div>
    </ModalCore>
  );
});
