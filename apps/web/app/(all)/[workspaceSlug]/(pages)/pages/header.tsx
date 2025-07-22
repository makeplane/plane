"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Home } from "lucide-react";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// plane imports
import { GITHUB_REDIRECTED_TRACKER_EVENT, PAGE_HEADER_NAVBAR_TRACKER_ELEMENT } from "@plane/constants";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";

export const PagesAppDashboardHeader = () => {
  // hooks
  const { resolvedTheme } = useTheme();

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink label="Home" icon={<Home className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <a
          onClick={() =>
            captureElementAndEvent({
              element: {
                elementName: PAGE_HEADER_NAVBAR_TRACKER_ELEMENT,
              },
              event: {
                eventName: GITHUB_REDIRECTED_TRACKER_EVENT,
                state: "SUCCESS",
                payload: {
                  element: PAGE_HEADER_NAVBAR_TRACKER_ELEMENT,
                },
              },
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
  );
};
