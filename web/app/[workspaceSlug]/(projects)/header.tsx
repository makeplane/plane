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
        <Header.RightItem>
          <a
            onClick={() =>
              captureEvent(GITHUB_REDIRECTED, {
                element: "navbar",
              })
            }
            className="flex flex-shrink-0 items-center gap-1.5 rounded bg-custom-background-80 px-3 py-1.5"
            href="https://github.com/makeplane/plane"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={resolvedTheme === "dark" ? githubWhiteImage : githubBlackImage}
              height={16}
              width={16}
              alt="GitHub Logo"
            />
            <span className="hidden text-xs font-medium sm:hidden md:block">Star us on GitHub</span>
          </a>
        </Header.RightItem>
      </Header>
    </>
  );
};
