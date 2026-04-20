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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  roleId: string | null;
};

export const EnableRoleModal = observer(function EnableRoleModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, roleId } = props;
  // states
  const [isEnabling, setIsEnabling] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getRoleDetailsByRoleId, enableRole } = useRoleManagement();

  const roleDetails = roleId ? getRoleDetailsByRoleId(roleId) : undefined;
  const roleName = roleDetails?.name ?? "";

  const handleClose = () => {
    if (isEnabling) return;
    onClose();
  };

  const handleEnable = async () => {
    if (!roleId) return;
    try {
      setIsEnabling(true);
      await enableRole({ workspaceSlug, roleId });
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("workspace_settings.settings.roles_and_schemes.enable_role.success_toast_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.disable_role.error_toast_description"),
      });
    } finally {
      setIsEnabling(false);
    }
  };

  if (!roleId) return null;

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      handleSubmit={handleEnable}
      isSubmitting={isEnabling}
      title={t("workspace_settings.settings.roles_and_schemes.enable_role.confirm_title", { roleName })}
      content={t("workspace_settings.settings.roles_and_schemes.enable_role.confirm_message")}
      primaryButtonText={{
        loading: t("workspace_settings.settings.roles_and_schemes.enable_role.submitting"),
        default: t("workspace_settings.settings.roles_and_schemes.enable_role.submit_button"),
      }}
      variant="primary"
    />
  );
});
