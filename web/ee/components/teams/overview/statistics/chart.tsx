import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TreeMapItem } from "@plane/types";
import { Avatar, Button, Loader, Logo, TreeMapIcon } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { TreeMapChart } from "@/components/core/charts/tree-map";
// hooks
import { useMember, useProject } from "@/hooks/store";
// plane web imports
import { SectionEmptyState } from "@/plane-web/components/common";
import {
  WORKSPACE_PROJECT_STATE_GROUPS,
  WORKSPACE_PROJECT_STATE_PRIORITY,
} from "@/plane-web/constants/workspace-project-states";
import { useTeams, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamAnalytics } from "@/plane-web/hooks/store/teams/use-team-analytics";

type TTeamStatisticsMapProps = {
  teamId: string;
};

export const TeamStatisticsMap: React.FC<TTeamStatisticsMapProps> = observer((props) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { isSettingsEnabled, getProjectStateById } = useWorkspaceProjectStates();
  const { getTeamEntitiesLoaderById } = useTeams();
  const { getTeamStatisticsLoader, getTeamStatisticsFilter, getTeamStatistics, clearTeamStatisticsFilter } =
    useTeamAnalytics();
  // derived values
  const teamEntitiesLoader = getTeamEntitiesLoaderById(teamId);
  const teamStatisticsLoader = getTeamStatisticsLoader(teamId);
  const teamStatisticsFilter = getTeamStatisticsFilter(teamId);
  const teamStatistics = getTeamStatistics(teamId);
  const currentDataKey = teamStatisticsFilter.data_key;
  const currentLegend = teamStatisticsFilter.legend;
  const isLoading = teamEntitiesLoader === "init-loader" || teamStatisticsLoader === "init-loader";
  const isUpdating = isLoading || teamStatisticsLoader === "mutation";
  const showFilterEmptyState =
    !isLoading && teamStatistics && (teamStatistics.length === 0 || teamStatistics.every((item) => item.count === 0));
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
      {isUpdating ? (
        <Loader className="w-full h-96 flex items-center justify-center">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      ) : showFilterEmptyState ? (
        <SectionEmptyState
          heading={t("team-stats-filter-empty-state-title")}
          subHeading={t("team-stats-filter-empty-state-description")}
          icon={<TreeMapIcon className="size-6 text-custom-text-400" />}
          actionElement={
            <Button
              variant="link-primary"
              size="md"
              className="bg-transparent"
              disabled={isUpdating}
              onClick={() => clearTeamStatisticsFilter(workspaceSlug?.toString(), teamId)}
            >
              Clear filters
            </Button>
          }
          variant="solid"
          iconVariant="round"
          size="md"
          containerClassName="h-96 gap-2"
          contentClassName="gap-1"
        />
      ) : (
        <TreeMapChart data={data} isAnimationActive />
      )}
    </>
  );
});
