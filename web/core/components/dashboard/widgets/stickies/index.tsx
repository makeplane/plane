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
import { WidgetLoader } from "@/components/dashboard/widgets";
// constants
import { PROJECT_BACKGROUND_COLORS } from "@/constants/dashboard";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useEventTracker, useDashboard, useProject, useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { StickiesLayout } from "./stickies-layout";

const WIDGET_KEY = "recent_projects";

export const StickiesWidget: React.FC<WidgetProps> = observer((props) => {
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
          My Stickies{" "}
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
              <p className="text-sm font-medium text-custom-primary-100">Add Stickies </p>
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-8 max-h-[500px] overflow-hidden">
        <StickiesLayout />
        <button className="flex justify-center absolute bottom-0 h-[50px] text-sm font-medium text-custom-primary-100 w-full text-center bg-gradient-to-t from-custom-background-100 via-custom-background-100 to-transparent">
          <p className="my-auto mb-0"> Show 12 more</p>
        </button>
      </div>
    </div>
  );
});
