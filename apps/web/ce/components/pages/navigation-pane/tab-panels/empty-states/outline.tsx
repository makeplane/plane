import Image from "next/image";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import darkOutlineAsset from "@/app/assets/empty-state/wiki/navigation-pane/outline-dark.webp?url";
import lightOutlineAsset from "@/app/assets/empty-state/wiki/navigation-pane/outline-light.webp?url";

export const PageNavigationPaneOutlineTabEmptyState = () => {
  // theme hook
  const { resolvedTheme } = useTheme();
  // asset resolved path
  const resolvedPath = resolvedTheme === "light" ? lightOutlineAsset : darkOutlineAsset;
  // translation
  const { t } = useTranslation();

  return (
    <div className="size-full grid place-items-center">
      <div className="flex flex-col items-center gap-y-6 text-center">
        <Image src={resolvedPath} width={160} height={160} alt="An image depicting the outline of a page" />
        <div className="space-y-2.5">
          <h4 className="text-base font-medium">{t("page_navigation_pane.tabs.outline.empty_state.title")}</h4>
          <p className="text-sm text-custom-text-200 font-medium">
            {t("page_navigation_pane.tabs.outline.empty_state.description")}
          </p>
        </div>
      </div>
    </div>
  );
};
