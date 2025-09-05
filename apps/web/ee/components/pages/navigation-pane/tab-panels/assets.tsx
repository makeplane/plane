import { Download, File } from "lucide-react";
// plane imports
import { ADDITIONAL_EXTENSIONS } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
// ce imports
import { TAdditionalPageNavigationPaneAssetItemProps } from "@/ce/components/pages/navigation-pane/tab-panels/assets";

export const AdditionalPageNavigationPaneAssetItem: React.FC<TAdditionalPageNavigationPaneAssetItemProps> = (props) => {
  const { asset, assetSrc, assetDownloadSrc } = props;
  // translation
  const { t } = useTranslation();

  if (asset.type === ADDITIONAL_EXTENSIONS.ATTACHMENT) {
    return (
      <a
        href={asset.href}
        className="relative group/asset-item h-12 flex items-center gap-2 pr-2 rounded border border-custom-border-200 hover:bg-custom-background-80 transition-colors"
      >
        <div className="flex-shrink-0 w-11 h-12 rounded-l grid place-items-center">
          <File className="size-6 text-custom-text-300" />
        </div>
        <div className="flex-1 space-y-0.5 truncate">
          <p className="text-sm font-medium truncate">{asset.name}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="shrink-0 text-xs text-custom-text-200" />
            <a
              href={assetDownloadSrc}
              target="_blank"
              rel="noreferrer noopener"
              className="shrink-0 py-0.5 px-1 flex items-center gap-1 rounded text-custom-text-200 hover:text-custom-text-100 opacity-0 pointer-events-none group-hover/asset-item:opacity-100 group-hover/asset-item:pointer-events-auto transition-opacity"
            >
              <Download className="shrink-0 size-3" />
              <span className="text-xs font-medium">{t("page_navigation_pane.tabs.assets.download_button")}</span>
            </a>
          </div>
        </div>
      </a>
    );
  }

  return null;
};
