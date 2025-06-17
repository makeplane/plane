import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
// plane imports
import type { TEditorAsset } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { convertBytesToSize, getEditorAssetDownloadSrc, getEditorAssetSrc } from "@plane/utils";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { AdditionalPageNavigationPaneAssetItem } from "@/plane-web/components/pages/navigation-pane/tab-panels/assets";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

type AssetItemProps = {
  asset: TEditorAsset;
  page: TPageInstance;
};

const AssetItem = observer((props: AssetItemProps) => {
  const { asset, page } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // derived values
  const { project_ids } = page;
  // translation
  const { t } = useTranslation();

  const getAssetSrc = (path: string) => {
    if (!path || !workspaceSlug) return "";
    if (path.startsWith("http")) {
      return path;
    } else {
      return (
        getEditorAssetSrc({
          assetId: path,
          projectId: project_ids?.[0],
          workspaceSlug: workspaceSlug.toString(),
        }) ?? ""
      );
    }
  };

  const getAssetDownloadSrc = (path: string) => {
    if (!path || !workspaceSlug) return "";
    if (path.startsWith("http")) {
      return path;
    } else {
      return (
        getEditorAssetDownloadSrc({
          assetId: path,
          projectId: project_ids?.[0],
          workspaceSlug: workspaceSlug.toString(),
        }) ?? ""
      );
    }
  };

  if (asset.type === "IMAGE" || asset.type === "CUSTOM_IMAGE")
    return (
      <a
        href={asset.scrollId}
        className="relative group/asset-item h-12 flex items-center gap-2 pr-2 rounded border border-custom-border-200 hover:bg-custom-background-80 transition-colors"
      >
        <div
          className="flex-shrink-0 w-11 h-12 rounded-l bg-cover bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('${getAssetSrc(asset.src)}')`,
          }}
        />
        <div className="flex-1 space-y-0.5 truncate">
          <p className="text-sm font-medium truncate">{asset.name}</p>
          <div className="flex items-end justify-between gap-2">
            <p className="shrink-0 text-xs text-custom-text-200">{convertBytesToSize(Number(asset.size || 0))}</p>
            <a
              href={getAssetDownloadSrc(asset.src)}
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

  return <AdditionalPageNavigationPaneAssetItem asset={asset} page={page} />;
});

export const PageNavigationPaneAssetsTabPanel: React.FC<Props> = observer((props) => {
  const { page } = props;
  // derived values
  const {
    editor: { assetsList },
  } = page;
  // translation
  const { t } = useTranslation();

  // asset resolved path
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/pages/navigation-pane/assets" });

  if (assetsList.length === 0)
    return (
      <div className="size-full grid place-items-center">
        <div className="flex flex-col items-center gap-y-6 text-center">
          <Image src={resolvedPath} width={160} height={160} alt="An image depicting the assets of a page" />
          <div className="space-y-2.5">
            <h4 className="text-base font-medium">{t("page_navigation_pane.tabs.assets.empty_state.title")}</h4>
            <p className="text-sm text-custom-text-200 font-medium">
              {t("page_navigation_pane.tabs.assets.empty_state.description")}
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mt-5 space-y-4">
      {assetsList?.map((asset) => <AssetItem key={asset.id} asset={asset} page={page} />)}
    </div>
  );
});
