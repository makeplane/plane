"use client";

import { observer } from "mobx-react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// hooks
import { useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// assets
import ProjectEmptyStateImage from "@/public/empty-state/onboarding/dashboard-light.webp";

export const DashboardProjectEmptyState = observer(() => {
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const canCreateProject = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <div className="mx-auto flex h-full flex-col justify-center space-y-4 lg:w-3/5">
      <h4 className="text-xl font-semibold">Overview of your projects, activity, and metrics</h4>
      <p className="text-custom-text-300">
        Welcome to Plane, we are excited to have you here. Create your first project and track your issues, and this
        page will transform into a space that helps you progress. Admins will also see items which help their team
        progress.
      </p>
      <Image src={ProjectEmptyStateImage} className="w-full" alt="Project empty state" />
      {canCreateProject && (
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={() => {
              setTrackElement("Project empty state");
              toggleCreateProjectModal(true);
            }}
          >
            Build your first project
          </Button>
        </div>
      )}
    </div>
  );
});
