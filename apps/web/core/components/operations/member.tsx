/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Avatar } from "@makeplane/propel/components/avatar";
import { getFileURL } from "@workspaces/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  memberId: string;
  /** Used until the member store has loaded, and if the member is no longer in it. */
  fallbackName?: string | null;
  fallbackAvatarUrl?: string | null;
  size?: "sm" | "md";
  showName?: boolean;
};

/**
 * One member, as a face and a name.
 *
 * The operations endpoints already return a display name and avatar so the
 * screens work before the member store has hydrated; the store is preferred
 * once it has, because it is the one that stays current.
 */
export const OperationsMember = observer(function OperationsMember({
  memberId,
  fallbackName,
  fallbackAvatarUrl,
  size = "sm",
  showName = true,
}: Props) {
  const { getUserDetails } = useMember();
  const details = getUserDetails(memberId);

  const name = details?.display_name ?? fallbackName ?? "Member";
  const avatarUrl = details?.avatar_url ?? fallbackAvatarUrl ?? undefined;

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Avatar
        size={size}
        alt={name}
        fallback={name?.[0]?.toUpperCase()}
        src={avatarUrl ? getFileURL(avatarUrl) : undefined}
      />
      {showName && <span className="truncate text-13 text-secondary">{name}</span>}
    </span>
  );
});
