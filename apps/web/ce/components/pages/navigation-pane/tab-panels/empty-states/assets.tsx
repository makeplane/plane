import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import darkAssetsAsset from "@/app/assets/empty-state/wiki/navigation-pane/assets-dark.webp?url";
import lightAssetsAsset from "@/app/assets/empty-state/wiki/navigation-pane/assets-light.webp?url";

export function PageNavigationPaneAssetsTabEmptyState() {
  // theme hook
  const { resolvedTheme } = useTheme();
  // asset resolved path
  const resolvedPath = resolvedTheme === "light" ? lightAssetsAsset : darkAssetsAsset;
  // translation
  const { t } = useTranslation();

  return (
    <div className="size-full grid place-items-center">
      <div className="flex flex-col items-center gap-y-6 text-center">
        <img
          src={resolvedPath}
          className="w-[160px] h-[160px] object-contain"
          alt="An image depicting the assets of a page"
        />
        <div className="space-y-2.5">
          <h4 className="text-base font-medium">{t("page_navigation_pane.tabs.assets.empty_state.title")}</h4>
          <p className="text-sm text-custom-text-200 font-medium">
            {t("page_navigation_pane.tabs.assets.empty_state.description")}
          </p>
        </div>
      </div>
    </div>
  );
}
