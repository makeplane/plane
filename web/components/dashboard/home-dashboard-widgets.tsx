import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useDashboard } from "hooks/store";
// components
import {
  AssignedIssuesWidget,
  CreatedIssuesWidget,
  IssuesByPriorityWidget,
  IssuesByStateGroupWidget,
  OverviewStatsWidget,
  RecentActivityWidget,
  RecentCollaboratorsWidget,
  RecentProjectsWidget,
} from "components/dashboard";
// types
import { TWidgetKeys } from "@plane/types";

export const DashboardWidgets: React.FC<any> = observer((props) => {
  const {} = props;
  // store hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { homeDashboardId, homeDashboardWidgets } = useDashboard();

  const doesWidgetExist = (widgetKey: TWidgetKeys) =>
    Boolean(homeDashboardWidgets?.find((widget) => widget.key === widgetKey));

  if (!workspaceSlug || !homeDashboardId) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-7">
      {doesWidgetExist("overview_stats") && (
        <div className="lg:col-span-2">
          <OverviewStatsWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
        </div>
      )}
      {doesWidgetExist("assigned_issues") && (
        <AssignedIssuesWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
      )}
      {doesWidgetExist("created_issues") && (
        <CreatedIssuesWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
      )}
      {doesWidgetExist("issues_by_state_groups") && (
        <IssuesByStateGroupWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
      )}
      {doesWidgetExist("issues_by_priority") && (
        <IssuesByPriorityWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
      )}
      {doesWidgetExist("recent_activity") && (
        <RecentActivityWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
      )}
      {doesWidgetExist("recent_projects") && (
        <RecentProjectsWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
      )}
      {doesWidgetExist("recent_collaborators") && (
        <div className="lg:col-span-2">
          <RecentCollaboratorsWidget dashboardId={homeDashboardId} workspaceSlug={workspaceSlug} />
        </div>
      )}
    </div>
  );
});
