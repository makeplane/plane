"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTeamspaces } from "@/plane-web/hooks/store";

export default function TeamspaceDetailLayout({ children }: { children: ReactNode }) {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  // store hooks
  const { isUserMemberOfTeamspace, fetchTeamspaceDetails } = useTeamspaces();
  // derived values
  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamspaceId = routerTeamSpaceId!.toString();
  const isTeamspaceMember = isUserMemberOfTeamspace(teamspaceId);

  // fetching teamspace details
  useSWR(
    workspaceSlug && teamspaceId && isTeamspaceMember
      ? `WORKSPACE_TEAMSPACES_${workspaceSlug}_${teamspaceId}_${isTeamspaceMember}`
      : null,
    workspaceSlug && teamspaceId && isTeamspaceMember ? () => fetchTeamspaceDetails(workspaceSlug, teamspaceId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return <>{children}</>;
}
