"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTeams } from "@/plane-web/hooks/store";

export default function TeamsDetailLayout({ children }: { children: ReactNode }) {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamId: routerTeamId } = useParams();
  // store hooks
  const { isUserMemberOfTeam, fetchTeamDetails } = useTeams();
  // derived values
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamId = routerTeamId!.toString();
  const isTeamMember = isUserMemberOfTeam(teamId);

  // fetching team details
  useSWR(
    workspaceSlug && teamId && isTeamMember ? `WORKSPACE_TEAMS_${workspaceSlug}_${teamId}_${isTeamMember}` : null,
    workspaceSlug && teamId && isTeamMember ? () => fetchTeamDetails(workspaceSlug, teamId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return <>{children}</>;
}
