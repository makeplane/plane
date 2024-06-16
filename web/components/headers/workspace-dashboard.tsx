import Image from "next/image";
import { useTheme } from "next-themes";
import { Home, Zap } from "lucide-react";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// hooks
// components
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common";
// constants
import { CHANGELOG_REDIRECTED, GITHUB_REDIRECTED } from "@/constants/event-tracker";
import { useEventTracker } from "@/hooks/store";

export const WorkspaceDashboardHeader = () => {
  // hooks
  const { captureEvent } = useEventTracker();
  const { resolvedTheme } = useTheme();

  return (
    <>
      <div className="relative z-[15] flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
        <div className="flex items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={<BreadcrumbLink label="Home" icon={<Home className="h-4 w-4 text-custom-text-300" />} />}
              />
            </Breadcrumbs>
          </div>
        </div>
      </div>
    </>
  );
};
