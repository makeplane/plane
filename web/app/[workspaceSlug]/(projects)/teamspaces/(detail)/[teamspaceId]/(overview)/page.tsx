"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
// plane web components
import { TeamsOverviewRoot } from "@/plane-web/components/teamspaces/overview/root";
// plane web hooks
import { useFlag, useTeamspaces, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamspaceOverviewPage = observer(() => {
  // router
  const { workspaceSlug, teamspaceId } = useParams();
  // store
  const { fetchProjectAttributes } = useProjectAdvanced();
  const { loader, getTeamspaceById, getTeamspaceProjectIds } = useTeamspaces();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());
  const teamspaceProjectIds = getTeamspaceProjectIds(teamspaceId?.toString());
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");
  // fetch team project attributes
  useSWR(
    workspaceSlug && isProjectGroupingEnabled && teamspaceProjectIds && teamspaceProjectIds.length > 0
      ? ["teamspaceProjectAttributes", workspaceSlug, isProjectGroupingEnabled, ...teamspaceProjectIds]
      : null,
    workspaceSlug && isProjectGroupingEnabled && teamspaceProjectIds && teamspaceProjectIds.length > 0
      ? () =>
          fetchProjectAttributes(workspaceSlug.toString(), {
            project_ids: teamspaceProjectIds?.join(","),
          })
      : null
  );

  if (loader === "init-loader")
    return (
      <div className="h-full w-full flex justify-center items-center">
        <LogoSpinner />
      </div>
    );

  // Empty state if teamspace is not found
  if (!teamspaceId || !teamspace) return null;

  return <TeamsOverviewRoot teamspaceId={teamspaceId.toString()} />;
});

export default TeamspaceOverviewPage;
