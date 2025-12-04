import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
// plane imports
import { CORE_EXTENSIONS } from "@plane/editor";
import type { TEditorAsset } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { getEditorAssetDownloadSrc, getEditorAssetSrc } from "@plane/utils";
// plane web imports
import { AdditionalPageNavigationPaneAssetItem } from "@/plane-web/components/pages/navigation-pane/tab-panels/assets";
import { PageNavigationPaneAssetsTabEmptyState } from "@/plane-web/components/pages/navigation-pane/tab-panels/empty-states/assets";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

type AssetItemProps = {
  asset: TEditorAsset;
  page: TPageInstance;
};

const AssetItem = observer(function AssetItem(props: AssetItemProps) {
  const { asset, page } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // derived values
  const { project_ids } = page;
  // translation
  const { t } = useTranslation();

  const assetSrc: string = useMemo(() => {
    if (!asset.src || !workspaceSlug) return "";
    if (asset.src.startsWith("http")) {
      return asset.src;
    } else {
      return (
        getEditorAssetSrc({
          assetId: asset.src,
          projectId: project_ids?.[0],
          workspaceSlug: workspaceSlug.toString(),
        }) ?? ""
      );
    }
  }, [asset.src, project_ids, workspaceSlug]);

  const assetDownloadSrc: string = useMemo(() => {
    if (!asset.src || !workspaceSlug) return "";
    if (asset.src.startsWith("http")) {
      return asset.src;
    } else {
      return (
        getEditorAssetDownloadSrc({
          assetId: asset.src,
          projectId: project_ids?.[0],
          workspaceSlug: workspaceSlug.toString(),
        }) ?? ""
      );
    }
  }, [asset.src, project_ids, workspaceSlug]);

  if ([CORE_EXTENSIONS.IMAGE, CORE_EXTENSIONS.CUSTOM_IMAGE].includes(asset.type as CORE_EXTENSIONS))
    return (
      <a
        href={asset.href}
        className="relative group/asset-item h-12 flex items-center gap-2 pr-2 rounded-sm border border-subtle hover:bg-layer-1 transition-colors"
      >
        <div
          className="flex-shrink-0 w-11 h-12 rounded-l-sm bg-cover bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('${assetSrc}')`,
          }}
        />
        <div className="flex-1 space-y-0.5 truncate">
          <p className="text-13 font-medium truncate">{asset.name}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="shrink-0 text-11 text-secondary" />
            <a
              href={assetDownloadSrc}
              target="_blank"
              rel="noreferrer noopener"
              className="shrink-0 py-0.5 px-1 flex items-center gap-1 rounded-sm text-secondary hover:text-primary opacity-0 pointer-events-none group-hover/asset-item:opacity-100 group-hover/asset-item:pointer-events-auto transition-opacity"
            >
              <Download className="shrink-0 size-3" />
              <span className="text-11 font-medium">{t("page_navigation_pane.tabs.assets.download_button")}</span>
            </a>
          </div>
        </div>
      </a>
    );

  return (
    <AdditionalPageNavigationPaneAssetItem
      asset={asset}
      assetSrc={assetSrc}
      assetDownloadSrc={assetDownloadSrc}
      page={page}
    />
  );
});

export const PageNavigationPaneAssetsTabPanel = observer(function PageNavigationPaneAssetsTabPanel(props: Props) {
  const { page } = props;
  // derived values
  const {
    editor: { assetsList },
  } = page;

  if (assetsList.length === 0) return <PageNavigationPaneAssetsTabEmptyState />;

  return (
    <div className="mt-5 space-y-4">
      {assetsList?.map((asset) => (
        <AssetItem key={asset.id} asset={asset} page={page} />
      ))}
    </div>
  );
});
