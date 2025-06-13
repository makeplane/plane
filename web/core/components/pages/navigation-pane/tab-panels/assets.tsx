import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
// plane imports
import type { TEditorAsset } from "@plane/editor";
import { convertBytesToSize } from "@plane/utils";
// helpers
import { getEditorAssetDownloadSrc, getEditorAssetSrc } from "@/helpers/editor.helper";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
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

  return (
    <a
      href={asset.scrollId}
      className="relative group/asset-item h-12 flex items-center gap-2 rounded border border-custom-border-200 hover:bg-custom-background-80 transition-colors"
    >
      <div
        className="flex-shrink-0 w-11 h-12 rounded-l bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `url('${getAssetSrc(asset.src)}')`,
        }}
      />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">{asset.name}</p>
        <p className="text-xs text-custom-text-200">{convertBytesToSize(Number(asset.size || 0))}</p>
      </div>
      <a
        href={getAssetDownloadSrc(asset.src)}
        target="_blank"
        rel="noreferrer noopener"
        className="shrink-0 self-end mb-1 mr-1 py-0.5 px-1 flex items-center gap-1 rounded text-custom-text-200 hover:text-custom-text-100 opacity-0 pointer-events-none group-hover/asset-item:opacity-100 group-hover/asset-item:pointer-events-auto transition-all"
      >
        <Download className="shrink-0 size-3" />
        <span className="text-xs font-medium">Download</span>
      </a>
    </a>
  );
});

export const PageNavigationPaneAssetsTabPanel: React.FC<Props> = (props) => {
  const { page } = props;
  // states
  const [assets, setAssets] = useState<TEditorAsset[]>([]);
  // derived values
  const { editorRef } = page;
  // subscribe to asset changes
  useEffect(() => {
    const unsubscribe = editorRef?.onAssetChange(setAssets);
    // for initial render of this component to get the editor assets
    setAssets(editorRef?.getAssets() ?? []);
    return () => {
      unsubscribe?.();
    };
  }, [editorRef]);

  // asset resolved path
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/pages/navigation-pane/assets" });

  if (assets.length === 0)
    return (
      <div className="size-full grid place-items-center">
        <div className="flex flex-col items-center gap-y-6 text-center">
          <Image src={resolvedPath} width={160} height={160} alt="An image depicting the assets of a page" />
          <div className="space-y-2.5">
            <h4 className="text-base font-medium">Missing images</h4>
            <p className="text-sm text-custom-text-200 font-medium">Add images to see them here.</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mt-5 space-y-4">
      {assets?.map((asset) => <AssetItem key={asset.id} asset={asset} page={page} />)}
    </div>
  );
};
