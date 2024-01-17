import Image from "next/image";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useUser } from "hooks/store";
// ui
import { Button } from "@plane/ui";
// assets
import ProjectEmptyStateImage from "public/empty-state/dashboard/project.svg";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

export const DashboardProjectEmptyState = observer(() => {
  // store hooks
  const {
    commandPalette: { toggleCreateProjectModal },
  } = useApplication();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // derived values
  const canCreateProject = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  return (
    <div className="h-full flex flex-col justify-center lg:w-3/5 mx-auto space-y-4">
      <h4 className="text-xl font-semibold">Overview of your projects, activity, and metrics</h4>
      <p className="text-custom-text-300">
        Welcome to Plane, we are excited to have you here. Create your first project and track your issues, and this
        page will transform into a space that helps you progress. Admins will also see items which help their team
        progress.
      </p>
      <Image src={ProjectEmptyStateImage} className="w-full" alt="Project empty state" />
      {canCreateProject && (
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => toggleCreateProjectModal(true)}>
            Build your first project
          </Button>
        </div>
      )}
    </div>
  );
});
