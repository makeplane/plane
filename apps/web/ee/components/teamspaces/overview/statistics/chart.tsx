import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TEAMSPACE_ANALYTICS_TRACKER_ELEMENTS, TEAMSPACE_ANALYTICS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TreeMapChart } from "@plane/propel/charts/tree-map";
import { TreeMapItem } from "@plane/types";
import { Avatar, Button, Loader, Logo, TreeMapIcon } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useMember, useProject } from "@/hooks/store";
// plane web imports
import { SectionEmptyState } from "@/plane-web/components/common";
import {
  WORKSPACE_PROJECT_STATE_GROUPS,
  WORKSPACE_PROJECT_STATE_PRIORITY,
} from "@/plane-web/constants/workspace-project-states";
import { useTeamspaces, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useTeamspaceAnalytics } from "@/plane-web/hooks/store/teamspaces/use-teamspace-analytics";

type TTeamspaceStatisticsMapProps = {
  teamspaceId: string;
};

export const TeamspaceStatisticsMap: React.FC<TTeamspaceStatisticsMapProps> = observer((props) => {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { isSettingsEnabled, getProjectStateById } = useWorkspaceProjectStates();
  const { getTeamspaceEntitiesLoaderById } = useTeamspaces();
  const {
    getTeamspaceStatisticsLoader,
    getTeamspaceStatisticsFilter,
    getTeamspaceStatistics,
    clearTeamspaceStatisticsFilter,
  } = useTeamspaceAnalytics();
  // derived values
  const teamspaceEntitiesLoader = getTeamspaceEntitiesLoaderById(teamspaceId);
  const teamspaceStatisticsLoader = getTeamspaceStatisticsLoader(teamspaceId);
  const teamspaceStatisticsFilter = getTeamspaceStatisticsFilter(teamspaceId);
  const teamspaceStatistics = getTeamspaceStatistics(teamspaceId);
  const currentDataKey = teamspaceStatisticsFilter.data_key;
  const currentLegend = teamspaceStatisticsFilter.legend;
  const isLoading = teamspaceEntitiesLoader === "init-loader" || teamspaceStatisticsLoader === "init-loader";
  const isUpdating = isLoading || teamspaceStatisticsLoader === "mutation";
  const showFilterEmptyState =
    !isLoading &&
    teamspaceStatistics &&
    (teamspaceStatistics.length === 0 || teamspaceStatistics.every((item) => item.count === 0));
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
    [
      isSettingsEnabled,
      currentDataKey,
      currentLegend,
      getProjectById,
      getProjectStateById,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (id: string) => getProjectById(id)?.state_id,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (id: string) => getProjectById(id)?.priority,
    ]
  );
  // data
  const data: TreeMapItem[] = useMemo(() => {
    if (!teamspaceStatistics || !teamspaceStatistics.length) return [];
    return teamspaceStatistics.map((item) => ({
      name: getDataName(item.identifier),
      value: item.count,
      label: "work items",
      icon: getDataIcon(item.identifier) ?? undefined,
      ...getFillDetail(item.identifier),
    }));
  }, [teamspaceStatistics, getDataIcon, getDataName, getFillDetail]);

  const handleClearStatisticsFilter = () => {
    captureClick({
      elementName: TEAMSPACE_ANALYTICS_TRACKER_ELEMENTS.EMPTY_STATE_CLEAR_STATISTICS_FILTERS_BUTTON,
    });
    clearTeamspaceStatisticsFilter(workspaceSlug?.toString(), teamspaceId)
      .then(() => {
        captureSuccess({
          eventName: TEAMSPACE_ANALYTICS_TRACKER_EVENTS.STATISTICS_FILTER_CLEARED,
          payload: {
            id: teamspaceId,
          },
        });
      })
      .catch(() => {
        captureError({
          eventName: TEAMSPACE_ANALYTICS_TRACKER_EVENTS.STATISTICS_FILTER_CLEARED,
          payload: {
            id: teamspaceId,
          },
        });
      });
  };

  return (
    <>
      {isUpdating ? (
        <Loader className="w-full h-96 flex items-center justify-center">
          <Loader.Item width="100%" height="100%" />
        </Loader>
      ) : showFilterEmptyState ? (
        <SectionEmptyState
          heading={t("teamspace_analytics.empty_state.stats.filter.title")}
          subHeading={t("teamspace_analytics.empty_state.stats.filter.description")}
          icon={<TreeMapIcon className="size-6 text-custom-text-400" />}
          actionElement={
            <Button
              variant="link-primary"
              size="md"
              className="bg-transparent"
              disabled={isUpdating}
              onClick={handleClearStatisticsFilter}
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
