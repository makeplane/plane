import { useTheme } from "next-themes";
// plane imports
import { HEADER_GITHUB_ICON, GITHUB_REDIRECTED_TRACKER_EVENT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// assets
import githubBlackImage from "@/app/assets/logos/github-black.png?url";
import githubWhiteImage from "@/app/assets/logos/github-white.png?url";
// helpers
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";

export function StarUsOnGitHubLink() {
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
      className="flex flex-shrink-0 items-center gap-1.5 rounded-sm bg-layer-2 px-3 py-1.5"
      href="https://github.com/makeplane/plane"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={imageSrc} className="h-4 w-4 object-contain" alt="GitHub Logo" aria-hidden="true" />
      <span className="hidden text-11 font-medium sm:hidden md:block">{t("home.star_us_on_github")}</span>
    </a>
  );
}
