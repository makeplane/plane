import Image from "next/image";
import { USER_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

export const ProductUpdatesFooter = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between flex-shrink-0 gap-4 m-6 mb-4">
      <div className="flex items-center gap-2">
        <a
          href="https://go.plane.so/p-docs"
          target="_blank"
          className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
        >
          {t("docs")}
        </a>
        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
          <circle cx={1} cy={1} r={1} />
        </svg>
        <a
          data-ph-element={USER_TRACKER_ELEMENTS.CHANGELOG_REDIRECTED}
          href="https://go.plane.so/p-changelog"
          target="_blank"
          className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
        >
          {t("full_changelog")}
        </a>
        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
          <circle cx={1} cy={1} r={1} />
        </svg>
        <a
          href="mailto:support@plane.so"
          target="_blank"
          className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
        >
          {t("support")}
        </a>
        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
          <circle cx={1} cy={1} r={1} />
        </svg>
        <a
          href="https://go.plane.so/p-discord"
          target="_blank"
          className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
        >
          Discord
        </a>
      </div>
      <a
        href="https://plane.so/pages"
        target="_blank"
        className={cn(
          getButtonStyling("accent-primary", "sm"),
          "flex gap-1.5 items-center text-center font-medium hover:underline underline-offset-2 outline-none"
        )}
      >
        <Image src={PlaneLogo} alt="Plane" width={12} height={12} />
        {t("powered_by_plane_pages")}
      </a>
    </div>
  );
};
