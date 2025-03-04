"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Home } from "lucide-react";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// ui
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// constants
import { GITHUB_REDIRECTED } from "@/constants/event-tracker";
// hooks
import { useEventTracker } from "@/hooks/store";

export const WorkspaceDashboardHeader = () => {
  // hooks
  const { captureEvent } = useEventTracker();
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={<BreadcrumbLink label="Home" icon={<Home className="h-4 w-4 text-custom-text-300" />} />}
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
      </Header>
    </>
  );
};
