/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import type { IInstanceUser } from "@plane/services";
import { cn } from "@plane/utils";

type Props = {
  user: IInstanceUser;
};

export const UserListItem = observer(function UserListItem({ user }: Props) {
  const displayName = user.display_name || user.first_name || user.email;
  const initials = (user.first_name?.[0] || user.email[0]).toUpperCase();

  return (
    <Link
      href={`/users/${user.id}`}
      className="group flex items-center justify-between p-3 gap-2.5 border border-subtle hover:border-subtle-1 bg-layer-1 hover:bg-layer-1-hover hover:shadow-raised-100 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-primary text-on-color text-11 uppercase">
          {user.avatar ? (
            <img src={user.avatar} className="h-full w-full rounded-full object-cover" alt={displayName} />
          ) : (
            initials
          )}
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-14 font-medium">{displayName}</h3>
            <span
              className={cn(
                "text-11 px-1.5 py-0.5 rounded-sm font-medium",
                user.is_active ? "bg-success-subtle text-success-primary" : "bg-danger-subtle text-danger-primary"
              )}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <span className="text-12 text-tertiary">{user.email}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-12 text-tertiary">
        <span>Joined {new Date(user.date_joined).toLocaleDateString()}</span>
      </div>
    </Link>
  );
});
