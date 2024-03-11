// components
import { TWidgetKeys } from "@plane/types";
import { AssignedIssuesWidgetLoader } from "./assigned-issues";
import { IssuesByPriorityWidgetLoader } from "./issues-by-priority";
import { IssuesByStateGroupWidgetLoader } from "./issues-by-state-group";
import { OverviewStatsWidgetLoader } from "./overview-stats";
import { RecentActivityWidgetLoader } from "./recent-activity";
import { RecentCollaboratorsWidgetLoader } from "./recent-collaborators";
import { RecentProjectsWidgetLoader } from "./recent-projects";
// types

type Props = {
  widgetKey: TWidgetKeys;
};

export const WidgetLoader: React.FC<Props> = (props) => {
  const { widgetKey } = props;

  const loaders = {
    overview_stats: <OverviewStatsWidgetLoader />,
    assigned_issues: <AssignedIssuesWidgetLoader />,
    created_issues: <AssignedIssuesWidgetLoader />,
    issues_by_state_groups: <IssuesByStateGroupWidgetLoader />,
    issues_by_priority: <IssuesByPriorityWidgetLoader />,
    recent_activity: <RecentActivityWidgetLoader />,
    recent_projects: <RecentProjectsWidgetLoader />,
    recent_collaborators: <RecentCollaboratorsWidgetLoader />,
  };

  return loaders[widgetKey];
};
