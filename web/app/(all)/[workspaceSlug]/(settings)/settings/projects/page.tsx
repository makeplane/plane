"use client";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
import { useCommandPalette } from "@/hooks/store";

const ProjectSettingsPage = () => {
  // store hooks
  const { resolvedTheme } = useTheme();
  const { toggleCreateProjectModal } = useCommandPalette();
  // derived values
  const resolvedPath =
    resolvedTheme === "dark"
      ? "/empty-state/project-settings/no-projects-dark.png"
      : "/empty-state/project-settings/no-projects-light.png";
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-full max-w-[480px] mx-auto">
      <Image src={resolvedPath} alt="No projects yet" width={384} height={250} />
      <div className="text-lg font-semibold text-custom-text-350">No projects yet</div>
      <div className="text-sm text-custom-text-350 text-center">
        Projects act as the foundation for goal-driven work. They let you manage your teams, tasks, and everything you
        need to get things done.
      </div>
      <div className="flex gap-2">
        <Link href="https://plane.so/" target="_blank" className={cn(getButtonStyling("neutral-primary", "sm"))}>
          Learn more about projects
        </Link>
        <Button
          size="sm"
          onClick={() => toggleCreateProjectModal(true)}
          data-ph-element={PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON}
        >
          Start your first project
        </Button>
      </div>
    </div>
  );
};

export default ProjectSettingsPage;
