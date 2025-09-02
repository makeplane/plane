"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
// plane imports
import { HEADER_GITHUB_ICON, GITHUB_REDIRECTED_TRACKER_EVENT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// helpers
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
// public imports
import githubBlackImage from "@/public/logos/github-black.png";
import githubWhiteImage from "@/public/logos/github-white.png";

export const StarUsOnGitHubLink = () => {
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { resolvedTheme } = useTheme();
  const imageSrc = resolvedTheme === "dark" ? githubWhiteImage : githubBlackImage;

  return (
    <a
      aria-label={t("home.star_us_on_github")}
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
      <Image src={imageSrc} height={16} width={16} alt="GitHub Logo" aria-hidden="true" />
      <span className="hidden text-xs font-medium sm:hidden md:block">{t("home.star_us_on_github")}</span>
    </a>
  );
};
