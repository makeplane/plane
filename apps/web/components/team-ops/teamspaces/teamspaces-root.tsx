/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { Badge } from "@makeplane/propel/components/badge";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useCalendarSettings, useOpsTeams } from "@/hooks/team-ops/use-work-calendar";

type Props = { workspaceSlug: string };

/** The teams of the workspace: who is in each, who leads it, and a way to its calendar and settings. */
export const TeamspacesRoot = observer(function TeamspacesRoot({ workspaceSlug }: Props) {
  const { teams, isLoading } = useOpsTeams(workspaceSlug);
  const { permissions } = useCalendarSettings(workspaceSlug);
  const { getUserDetails } = useMember();
  const name = (id: string) => getUserDetails(id)?.display_name ?? "Unknown";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm-regular text-secondary">Teams group people for calendars, reports and approvals.</p>
        <div className="flex gap-3 text-body-sm-medium">
          {permissions?.can_view_team ? (
            <Link href={`/${workspaceSlug}/team-ops/calendar/team/`} className="text-accent-primary hover:underline">
              Team calendar
            </Link>
          ) : null}
          {permissions?.can_manage ? (
            <Link
              href={`/${workspaceSlug}/team-ops/calendar/settings/`}
              className="text-accent-primary hover:underline"
            >
              Manage teams
            </Link>
          ) : null}
        </div>
      </div>

      {isLoading ? null : !teams || teams.length === 0 ? (
        <p className="rounded-lg border border-dashed border-subtle p-4 text-body-sm-regular text-tertiary">
          There are no teams yet.
          {permissions?.can_manage
            ? " Create the first one under Manage teams."
            : " A workspace admin can create them."}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => {
            const leads = team.members.filter((member) => member.role === "LEAD");
            return (
              <li key={team.id} className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-h6-medium text-primary">{team.name}</h2>
                    {team.description ? (
                      <p className="text-caption-sm-regular text-tertiary">{team.description}</p>
                    ) : null}
                  </div>
                  <Badge
                    variant="neutral"
                    size="sm"
                    label={`${team.members.length} ${team.members.length === 1 ? "member" : "members"}`}
                  />
                </div>
                {leads.length > 0 ? (
                  <p className="text-caption-sm-regular text-secondary">
                    Lead: {leads.map((lead) => name(lead.user)).join(", ")}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-1">
                  {team.members.map((member) => (
                    <li key={member.user} className="flex items-center gap-2 text-body-sm-regular text-primary">
                      <ButtonAvatars showTooltip={false} userIds={member.user} size="xs" />
                      <span className="truncate">{name(member.user)}</span>
                      {member.role === "LEAD" ? (
                        <span className="text-caption-sm-regular text-tertiary">Lead</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
