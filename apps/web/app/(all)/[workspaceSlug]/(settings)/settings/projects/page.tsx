import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
// plane imports
import { PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// assets
import ProjectDarkEmptyState from "@/app/assets/empty-state/project-settings/no-projects-dark.png?url";
import ProjectLightEmptyState from "@/app/assets/empty-state/project-settings/no-projects-light.png?url";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";

function ProjectSettingsPage() {
  // store hooks
  const { resolvedTheme } = useTheme();
  const { toggleCreateProjectModal } = useCommandPalette();
  // derived values
  const resolvedPath = resolvedTheme === "dark" ? ProjectDarkEmptyState : ProjectLightEmptyState;
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-full max-w-[480px] mx-auto">
      <img src={resolvedPath} alt="No projects yet" />
      <div className="text-16 font-semibold text-tertiary">No projects yet</div>
      <div className="text-13 text-tertiary text-center">
        Projects act as the foundation for goal-driven work. They let you manage your teams, tasks, and everything you
        need to get things done.
      </div>
      <div className="flex gap-2">
        <Link href="https://plane.so/" target="_blank" className={cn(getButtonStyling("secondary", "base"))}>
          Learn more about projects
        </Link>
        <Button
          onClick={() => toggleCreateProjectModal(true)}
          data-ph-element={PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON}
        >
          Start your first project
        </Button>
      </div>
    </div>
  );
}

export default observer(ProjectSettingsPage);
