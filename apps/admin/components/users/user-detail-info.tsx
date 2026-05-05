/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { IInstanceUser } from "@plane/services";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useInstanceUser } from "@/hooks/store";

type Props = {
  user: IInstanceUser;
  userId: string;
};

export const UserDetailInfo = observer(function UserDetailInfo({ user, userId }: Props) {
  const { updateUser } = useInstanceUser();
  const displayName = user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email;
  const initials = (user.first_name?.[0] || user.email[0]).toUpperCase();

  const handleToggleActive = async () => {
    try {
      await updateUser(userId, { is_active: !user.is_active });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: user.is_active ? "User deactivated" : "User activated",
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update user status" });
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 border border-subtle rounded-lg bg-layer-1">
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary text-on-color text-16 uppercase">
        {user.avatar ? (
          <img src={user.avatar} className="h-full w-full rounded-full object-cover" alt={displayName} />
        ) : (
          initials
        )}
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-18 font-medium">{displayName}</h2>
          <span
            className={cn(
              "text-11 px-1.5 py-0.5 rounded-sm font-medium",
              user.is_active ? "bg-success-subtle text-success-primary" : "bg-danger-subtle text-danger-primary"
            )}
          >
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-13 text-tertiary">{user.email}</p>
        <div className="flex items-center gap-6 text-12 text-secondary pt-1">
          <span>Joined {new Date(user.date_joined).toLocaleDateString()}</span>
          {user.last_login && <span>Last login {new Date(user.last_login).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 text-13">
        <span className="text-secondary">Active</span>
        <ToggleSwitch value={user.is_active} onChange={() => void handleToggleActive()} size="sm" />
      </div>
    </div>
  );
});
