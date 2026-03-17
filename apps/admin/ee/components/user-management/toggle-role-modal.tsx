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

import { AlertModalCore } from "@plane/ui";
import type { FC } from "react";
import { useState } from "react";
import { useInstanceUser } from "@/plane-admin/hooks/store/use-instance-user";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { RowData } from "./list/helper";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: RowData;
  role: "user" | "admin";
}

export const ToggleRoleModal: FC<Props> = function ToggleRoleModal(props) {
  const { isOpen, onClose, data, role } = props;
  const instanceUser = useInstanceUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const targetRole = role === "admin" ? "Instance Admin" : "Instance User";
  const displayName = data.member.display_name || data.member.email;
  const email = data.member.email;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await instanceUser.toggleUserRole(data.member.id, role);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: `Role updated to ${targetRole}`,
      });
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to update role",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent =
    role === "admin" ? (
      <p className="text-13 text-secondary">
        This user <span className="font-bold">{displayName}</span> ({email}) will be upgraded to an admin.
      </p>
    ) : (
      <p className="text-13 text-secondary">
        This admin <span className="font-bold">{displayName}</span> ({email}) will be downgraded to a normal user and
        will lose access to god mode.
      </p>
    );

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleConfirm}
      isSubmitting={isSubmitting}
      title={role === "admin" ? "Grant admin access" : "Remove admin access"}
      variant="primary"
      content={modalContent}
      primaryButtonText={{
        loading: "Updating",
        default: "Confirm",
      }}
    />
  );
};
