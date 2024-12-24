"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane types
import { TRecentProjectsWidgetResponse } from "@plane/types";
// plane ui
import { Avatar, AvatarGroup } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { WidgetLoader, WidgetProps } from "@/components/dashboard/widgets";
// constants
import { PROJECT_BACKGROUND_COLORS } from "@/constants/dashboard";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useEventTracker, useDashboard, useProject, useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

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
    <Link
      href={`/${workspaceSlug}/projects/${projectId}/issues`}
      className="group flex items-center gap-4 border-[0.5px] border-custom-border-200 bg-custom-background-100 hover:shadow-sm rounded-md p-2 w-[290px]"
    >
      <div
        className={`grid h-[3.375rem] w-[3.375rem] flex-shrink-0 place-items-center rounded border border-transparent ${randomBgColor}`}
      >
        <div className="grid h-7 w-7 place-items-center">
          <Logo logo={projectDetails.logo_props} size={20} />
        </div>
      </div>
      <div className="flex-grow truncate">
        <h6 className="truncate text-sm font-medium text-custom-text-300 group-hover:text-custom-text-100 group-hover:underline">
          {projectDetails.name}
        </h6>
        <div className="mt-2">
          <AvatarGroup>
            {projectDetails.members?.map((member) => (
              <Avatar
                key={member.member_id}
                src={getFileURL(member.member__avatar_url)}
                name={member.member__display_name}
              />
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
  const { allowPermissions } = useUserPermissions();
  const { fetchWidgetStats, getWidgetStats } = useDashboard();
  // derived values
  const widgetStats = getWidgetStats<TRecentProjectsWidgetResponse>(workspaceSlug, dashboardId, WIDGET_KEY);
  const canCreateProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  useEffect(() => {
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href={`/${workspaceSlug}/projects`}
          className="text-base font-semibold text-custom-text-350 hover:underline my-auto"
        >
          Recent projects
        </Link>
        <div className="flex gap-4">
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
              <p className="text-sm font-medium text-custom-primary-100 group-hover:text-custom-text-100 group-hover:underline">
                Add project{" "}
              </p>
            </button>
          )}
          <Link href={`/${workspaceSlug}/projects`}>
            <p className="text-sm font-medium text-custom-primary-100 group-hover:text-custom-text-100 group-hover:underline">
              View all{" "}
            </p>
          </Link>
        </div>
      </div>
      <div className="mt-4 space-y-8">
        {widgetStats.map((projectId) => (
          <ProjectListItem key={projectId} projectId={projectId} workspaceSlug={workspaceSlug} />
        ))}
      </div>
    </div>
  );
});
