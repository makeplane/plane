import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Plus } from "lucide-react";
// types
import { TRecentProjectsWidgetResponse } from "@plane/types";
// ui
import { Avatar, AvatarGroup } from "@plane/ui";
// components
import { WidgetLoader, WidgetProps } from "@/components/dashboard/widgets";
import { ProjectLogo } from "@/components/project";
// constants
import { PROJECT_BACKGROUND_COLORS } from "@/constants/dashboard";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useEventTracker, useDashboard, useProject, useUser, useCommandPalette } from "@/hooks/store";

const WIDGET_KEY = "recent_projects";

type ProjectListItemProps = {
  projectId: string;
  workspaceSlug: string;
};

const ProjectListItem: React.FC<ProjectListItemProps> = observer((props) => {
  const { projectId, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();
  const projectDetails = getProjectById(projectId);

  const randomBgColor = PROJECT_BACKGROUND_COLORS[Math.floor(Math.random() * PROJECT_BACKGROUND_COLORS.length)];

  if (!projectDetails) return null;

  return (
    <Link href={`/${workspaceSlug}/projects/${projectId}/issues`} className="group flex items-center gap-8">
      <div
        className={`grid h-[3.375rem] w-[3.375rem] flex-shrink-0 place-items-center rounded border border-transparent ${randomBgColor}`}
      >
        <div className="grid h-7 w-7 place-items-center">
          <ProjectLogo logo={projectDetails.logo_props} className="text-xl" />
        </div>
      </div>
      <div className="flex-grow truncate">
        <h6 className="truncate text-sm font-medium text-custom-text-300 group-hover:text-custom-text-100 group-hover:underline">
          {projectDetails.name}
        </h6>
        <div className="mt-2">
          <AvatarGroup>
            {projectDetails.members?.map((member) => (
              <Avatar key={member.member_id} src={member.member__avatar} name={member.member__display_name} />
            ))}
          </AvatarGroup>
        </div>
      </div>
    </Link>
  );
});

export const RecentProjectsWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  // derived values
  const widgetStats = getWidgetStats<TRecentProjectsWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);
  const canCreateProject = currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div className="min-h-96 w-full rounded-xl border-[0.5px] border-custom-border-200 bg-custom-background-100 py-6 duration-300 hover:shadow-custom-shadow-4xl">
      <Link
        href={`/${workspaceSlug}/projects`}
        className="mx-7 text-lg font-semibold text-custom-text-300 hover:underline"
      >
        Recent projects
      </Link>
      <div className="mx-7 mt-4 space-y-8">
        {canCreateProject && (
          <button
            type="button"
            className="group flex items-center gap-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTrackElement("Sidebar");
              toggleCreateProjectModal(true);
            }}
          >
            <div className="grid h-[3.375rem] w-[3.375rem] flex-shrink-0 place-items-center rounded border border-dashed border-custom-primary-60 bg-custom-primary-100/20 text-custom-primary-100">
              <Plus className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-custom-text-300 group-hover:text-custom-text-100 group-hover:underline">
              Create new project
            </p>
          </button>
        )}
        {widgetStats.map((projectId) => (
          <ProjectListItem key={projectId} projectId={projectId} workspaceSlug={workspaceSlug} />
        ))}
      </div>
    </div>
  );
});
