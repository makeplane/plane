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
}

export const RemoveMemberModal: FC<Props> = function RemoveMemberModal(props) {
  const { isOpen, onClose, data } = props;
  const instanceUser = useInstanceUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await instanceUser.deleteUser(data.member.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "User deactivated successfully",
      });
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to deactivate user",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      title="Deactivate User"
      content={
        <p className="text-13 text-secondary">
          Are you sure you want to deactivate{" "}
          <span className="font-bold">{data.member.display_name || data.member.email}</span>? This will remove them from
          all workspaces and projects.
        </p>
      }
      primaryButtonText={{
        loading: "Deactivating",
        default: "Deactivate",
      }}
    />
  );
};
