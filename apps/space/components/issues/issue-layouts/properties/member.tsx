/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
import type { LucideIcon } from "lucide-react";
import { MembersOutline } from "@makeplane/propel/icons";
// plane ui
import { Avatar } from "@makeplane/propel/components/avatar";
import { AvatarGroup } from "@makeplane/propel/components/avatar-group";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
//
import type { TPublicMember } from "@/types/member";

type Props = {
  memberIds: string[];
  shouldShowBorder?: boolean;
};

type AvatarProps = {
  showTooltip: boolean;
  members: TPublicMember[];
  icon?: LucideIcon;
};

export const ButtonAvatars = observer(function ButtonAvatars(props: AvatarProps) {
  const { showTooltip, members, icon: Icon } = props;

  if (Array.isArray(members)) {
    if (members.length > 1) {
      const resolvedMembers = members.filter(Boolean);
      return (
        <AvatarGroup
          size="xs"
          label={resolvedMembers.map((member) => member.member__display_name).join(", ")}
          overflowTooltip={showTooltip ? undefined : `${resolvedMembers.length} total`}
        >
          {resolvedMembers.map((member) => (
            <Avatar
              key={member.id}
              src={member.member__avatar}
              alt={member.member__display_name}
              fallback={member.member__display_name?.[0]?.toUpperCase()}
              tooltip={!showTooltip}
            />
          ))}
        </AvatarGroup>
      );
    } else if (members.length === 1) {
      return (
        <Avatar
          size="xs"
          src={members[0].member__avatar}
          alt={members[0].member__display_name}
          fallback={members[0].member__display_name?.[0]?.toUpperCase()}
          tooltip={!showTooltip}
        />
      );
    }
  }

  return Icon ? (
    <Icon className="h-3 w-3 flex-shrink-0" />
  ) : (
    <MembersOutline className="mx-[4px] h-3 w-3 flex-shrink-0" />
  );
});

export const IssueBlockMembers = observer(function IssueBlockMembers({ memberIds, shouldShowBorder = true }: Props) {
  const { getMembersByIds } = useMember();

  const members = getMembersByIds(memberIds);

  return (
    <div className="relative flex h-full flex-wrap items-center gap-1">
      <div
        className={cn("flex flex-shrink-0 cursor-default items-center rounded-md text-11", {
          "border-[0.5px] border-strong px-2.5 py-1": shouldShowBorder && !members?.length,
        })}
      >
        <div className="flex items-center gap-1.5 text-secondary">
          <ButtonAvatars members={members} showTooltip={false} />
          {!shouldShowBorder && members.length <= 1 && (
            <span>{members?.[0]?.member__display_name ?? "No Assignees"}</span>
          )}
        </div>
      </div>
    </div>
  );
});
