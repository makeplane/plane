/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { getFileURL } from "@plane/utils";
import { setPromiseToast } from "@plane/propel/toast";
// hooks
import { useInstanceUser, useUser } from "@/hooks/store";

type TUserListItemProps = {
  userId: string;
};

export const UserListItem = observer(function UserListItem({ userId }: TUserListItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  // store hooks
  const { getUserById, updateUser } = useInstanceUser();
  const { currentUser } = useUser();
  // derived values
  const user = getUserById(userId);

  if (!user) return null;

  const isCurrentUser = currentUser?.id === userId;
  const avatarSrc = user.avatar_url ? getFileURL(user.avatar_url) : undefined;

  const toggleActive = async () => {
    setIsUpdating(true);
    const promise = updateUser(userId, { is_active: !user.is_active });
    setPromiseToast(promise, {
      loading: user.is_active ? "Deactivating user..." : "Activating user...",
      success: {
        title: "Success",
        message: () => (user.is_active ? "User deactivated" : "User activated"),
      },
      error: {
        title: "Error",
        message: () => "Failed to update user",
      },
    });
    await promise.catch(() => {}).finally(() => setIsUpdating(false));
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-layer-1 p-3 hover:border-subtle-1 hover:bg-layer-1-hover hover:shadow-raised-100">
      <div className="flex items-center gap-4 min-w-0">
        <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary text-11 font-medium uppercase text-on-color overflow-hidden">
          {avatarSrc ? (
            <img src={avatarSrc} className="h-full w-full object-cover" alt={user.display_name} />
          ) : (
            (user.display_name?.[0] ?? user.email?.[0] ?? "?")
          )}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-14 font-medium truncate">{user.display_name || `${user.first_name} ${user.last_name}`.trim() || "—"}</span>
            {user.is_instance_admin && (
              <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-10 font-medium text-amber-600">
                Instance Admin
              </span>
            )}
            {!user.is_active && (
              <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-10 font-medium text-red-500">
                Deactivated
              </span>
            )}
            {isCurrentUser && (
              <span className="shrink-0 rounded-full bg-accent-primary/10 px-2 py-0.5 text-10 font-medium text-accent-primary">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-11 text-tertiary mt-0.5">
            <span className="truncate">{user.email}</span>
            {user.date_joined && (
              <>
                <span>•</span>
                <span className="shrink-0">Joined {new Date(user.date_joined).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={isUpdating || isCurrentUser}
        onClick={toggleActive}
        className={`shrink-0 rounded-md px-3 py-1.5 text-12 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          user.is_active
            ? "border border-red-400 text-red-500 hover:bg-red-500/10"
            : "border border-green-500 text-green-600 hover:bg-green-500/10"
        }`}
      >
        {user.is_active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
});
