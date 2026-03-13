/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Avatar, cn } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type TAssigneeAvatarFilterProps = {
  memberId: string;
  isVisible: boolean;
  hasActiveFilter: boolean;
  onToggle: (memberId: string) => void;
};

export const AssigneeAvatarFilter = observer(function AssigneeAvatarFilter(props: TAssigneeAvatarFilterProps) {
  const { memberId, isVisible, hasActiveFilter, onToggle } = props;
  // hooks
  const { getUserDetails } = useMember();
  // derived values
  const memberDetails = getUserDetails(memberId);

  if (!memberDetails) return null;

  return (
    <button
      type="button"
      onClick={() => onToggle(memberId)}
      className={cn(
        "relative flex-shrink-0 rounded-full transition-all duration-150",
        "hover:z-20 hover:scale-110",
        "focus:outline-none focus:z-20",
        // Active filter styles - show ring on visible users
        hasActiveFilter && isVisible && "z-10 ring-2 ring-offset-1 ring-blue-500",
        // Visibility styles
        isVisible ? "opacity-100" : "opacity-40 hover:opacity-70"
      )}
    >
      <Avatar
        name={memberDetails.display_name}
        src={getFileURL(memberDetails.avatar_url)}
        size="md"
        showTooltip
      />
    </button>
  );
});
