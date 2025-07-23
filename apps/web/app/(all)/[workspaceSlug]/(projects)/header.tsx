"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Home, Shapes } from "lucide-react";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// ui
import { GITHUB_REDIRECTED_TRACKER_EVENT, HEADER_GITHUB_ICON } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// constants
// hooks
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
import { useHome } from "@/hooks/store/use-home";

export const WorkspaceDashboardHeader = observer(() => {
  // hooks
  const { resolvedTheme } = useTheme();
  const { toggleWidgetSettings } = useHome();
  const { t } = useTranslation();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2">
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink label={t("home.title")} icon={<Home className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => toggleWidgetSettings(true)}
            className="my-auto mb-0"
          >
            <Shapes size={16} />
            <div className="hidden text-xs font-medium sm:hidden md:block">{t("home.manage_widgets")}</div>
          </Button>
          <a
            onClick={() =>
              captureElementAndEvent({
                element: {
                  elementName: HEADER_GITHUB_ICON,
                },
                event: {
                  eventName: GITHUB_REDIRECTED_TRACKER_EVENT,
                  state: "SUCCESS",
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
            <span className="hidden text-xs font-medium sm:hidden md:block">{t("home.star_us_on_github")}</span>
          </a>
        </Header.RightItem>
      </Header>
    </>
  );
});
