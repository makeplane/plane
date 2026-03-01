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

import type { FC } from "react";
import { useMemo } from "react";
import { observer } from "mobx-react";
import { useMember } from "@/hooks/store/use-member";
import { WidgetWrapper } from "../widget-wrapper";
import { MemberCard } from "./member-card";
import { OverflowCard } from "./overflow-card";
import { useVisibleMembers } from "./use-visible-members";

type TeamSectionProps = {
  workspaceSlug: string;
};

export const TeamSection: FC<TeamSectionProps> = observer(function TeamSection({ workspaceSlug }) {
  const { workspace, getUserDetails } = useMember();

  const memberIds = useMemo(() => workspace.workspaceMemberIds ?? [], [workspace.workspaceMemberIds]);
  const totalMembers = memberIds.length;

  const { containerRef, visibleCount } = useVisibleMembers({ totalMembers });

  const { visibleMembers, overflowMembers, overflowCount } = useMemo(
    () => ({
      visibleMembers: memberIds.slice(0, visibleCount),
      overflowMembers: memberIds.slice(visibleCount),
      overflowCount: memberIds.length - visibleCount,
    }),
    [memberIds, visibleCount]
  );

  if (totalMembers === 0) {
    return null;
  }

  return (
    <WidgetWrapper title="Get your team on board" subtitle="Invite your colleagues to collaborate and build together.">
      <div
        ref={containerRef}
        className="flex gap-4 rounded-xl bg-layer-2 border border-subtle px-4 py-5 w-full shadow-raised-100 overflow-hidden"
        role="list"
        aria-label="Team members"
      >
        {visibleMembers.map((userId) => (
          <MemberCard key={userId} userId={userId} getUserDetails={getUserDetails} />
        ))}

        {overflowCount > 0 && (
          <OverflowCard
            overflowMembers={overflowMembers}
            overflowCount={overflowCount}
            workspaceSlug={workspaceSlug}
            getUserDetails={getUserDetails}
          />
        )}
      </div>
    </WidgetWrapper>
  );
});
