import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { TreeMapItem } from "@plane/types";
import { Avatar, Loader, Logo } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { TreeMapChart } from "@/components/core/charts/tree-map";
// hooks
import { useMember, useProject } from "@/hooks/store";
// plane web imports
import {
  WORKSPACE_PROJECT_STATE_GROUPS,
  WORKSPACE_PROJECT_STATE_PRIORITY,
} from "@/plane-web/constants/workspace-project-states";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";

type TTeamStatisticsMapProps = {
  teamId: string;
};

export const TeamStatisticsMap: React.FC<TTeamStatisticsMapProps> = observer((props) => {
  const { teamId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { isSettingsEnabled, getProjectStateById } = useWorkspaceProjectStates();
  const { getTeamStatisticsLoader, getTeamStatisticsFilter, getTeamStatistics } = useTeamAnalytics();
  // derived values
  const teamStatisticsLoader = getTeamStatisticsLoader(teamId);
  const teamStatisticsFilter = getTeamStatisticsFilter(teamId);
  const teamStatistics = getTeamStatistics(teamId);
  const currentDataKey = teamStatisticsFilter.data_key;
  const currentLegend = teamStatisticsFilter.legend;
  // helpers
  const getDataIcon: (id: string) => React.ReactElement | undefined = useCallback(
    (id) => {
      switch (currentDataKey) {
        case "projects": {
          const project = getProjectById(id);
          return project ? <Logo logo={project.logo_props} size={16} /> : undefined;
        }
        case "members": {
          const user = getUserDetails(id);
          return user ? (
            <span className="flex-shrink-0 relative">
              <Avatar
                key={user.id}
                name={user.display_name}
                src={getFileURL(user.avatar_url)}
                size={16}
                className="text-xs"
                showTooltip={false}
              />
            </span>
          ) : undefined;
        }
        default:
          return undefined;
      }
    },
    [currentDataKey, getProjectById, getUserDetails]
  );
  const getDataName: (id: string) => string = useCallback(
    (id) => {
      switch (currentDataKey) {
        case "projects": {
          const project = getProjectById(id);
          return project ? project.name : id;
        }
        case "members": {
          const user = getUserDetails(id);
          return user ? user.first_name + " " + user.last_name : id;
        }
        default:
          return id;
      }
    },
    [currentDataKey, getProjectById, getUserDetails]
  );
  const getFillDetail: (id: string) => { fillColor: string } | { fillClassName: string } = useCallback(
    (id) => {
      if (currentDataKey === "projects" && isSettingsEnabled) {
        // get project by id
        const project = getProjectById(id);
        switch (currentLegend) {
          case "state": {
            // get project state details
            const projectState = project?.state_id ? getProjectStateById(project.state_id) : undefined;
            // get project state color
            const projectStateGroupColor = projectState?.group
              ? WORKSPACE_PROJECT_STATE_GROUPS[projectState.group].background
              : undefined;
            return projectStateGroupColor
              ? { fillColor: projectStateGroupColor }
              : { fillClassName: "fill-custom-background-90" };
          }
          case "priority": {
            // get project priority color
            const projectPriorityColor = project?.priority
              ? WORKSPACE_PROJECT_STATE_PRIORITY[project.priority].background
              : undefined;
            return projectPriorityColor
              ? { fillColor: projectPriorityColor }
              : { fillClassName: "fill-custom-background-90" };
          }
          default:
            return { fillClassName: "fill-custom-background-90" };
        }
      }
      return {
        fillClassName: "fill-custom-background-90",
      };
    },
    [isSettingsEnabled, currentDataKey, currentLegend, getProjectById, getProjectStateById]
  );
  // data
  const data: TreeMapItem[] = useMemo(() => {
    if (!teamStatistics || !teamStatistics.length) return [];
    return teamStatistics.map((item) => ({
      name: getDataName(item.identifier),
      value: item.count,
      label: "issues",
      icon: getDataIcon(item.identifier) ?? undefined,
      ...getFillDetail(item.identifier),
    }));
  }, [teamStatistics, getDataIcon, getDataName, getFillDetail]);

  return (
    <>
      {teamStatisticsLoader === "init-loader" ? (
        <Loader className="w-full h-96 flex items-center justify-center">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      ) : (
        <TreeMapChart data={data} isAnimationActive />
      )}
    </>
  );
});
