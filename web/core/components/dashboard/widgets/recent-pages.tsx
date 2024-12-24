"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Plus } from "lucide-react";
// plane types
import { TRecentProjectsWidgetResponse } from "@plane/types";
// plane ui
import { Avatar, AvatarGroup, Card } from "@plane/ui";
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

import Tiles from "./my-stickies";

const WIDGET_KEY = "recent_projects";

type PageListItemProps = {
  pageId: string;
  workspaceSlug: string;
};

const PageListItem: React.FC<PageListItemProps> = observer((props) => {
  const { pageId, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();
  const pageDetails = getProjectById(pageId);

  const randomBgColor = PROJECT_BACKGROUND_COLORS[Math.floor(Math.random() * PROJECT_BACKGROUND_COLORS.length)];

  if (!pageDetails) return null;

  return (
    <div
      href={`/${workspaceSlug}/projects/${pageId}/issues`}
      className="w-[290px] border-[0.5px] border-custom-border-200 bg-custom-background-100 hover:shadow-sm rounded-md p-3"
    >
      {/* <Logo logo={projectDetails.logo_props} size={20} /> */}

      <div className="text-xs font-medium text-custom-text-300">Pulse</div>
      <div className="text-base font-medium my-2">Plane Check point meetings - December 2025</div>
      <div className="text-[11px] text-custom-text-400 border-b border-custom-border-100/80 pb-2">
        The below are the required design components. @sibira @shivangi @shrabani @bhavesh please take a look at them.{" "}
      </div>
      <div className="flex-grow truncate flex justify-between mt-2">
        <div className="my-auto">
          <AvatarGroup>
            {pageDetails.members?.map((member) => (
              <Avatar
                key={member.member_id}
                src={getFileURL(member.member__avatar_url)}
                name={member.member__display_name}
              />
            ))}
          </AvatarGroup>
        </div>
        <div className="text-custom-text-400 text-xs my-auto">Last updated 2h ago</div>
      </div>
    </div>
  );
});

export const RecentPagesWidget: React.FC<WidgetProps> = observer((props) => {
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
          Recent pages
        </Link>
      </div>

      <div className="mt-4 space-y-8">
        {widgetStats.map((pageId) => (
          <PageListItem key={pageId} pageId={pageId} workspaceSlug={workspaceSlug} />
        ))}
      </div>
    </div>
  );
});
