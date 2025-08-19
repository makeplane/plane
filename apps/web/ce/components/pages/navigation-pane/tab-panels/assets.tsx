// plane imports
import type { TEditorAsset } from "@plane/editor";
// store
import type { TPageInstance } from "@/store/pages/base-page";

export type TAdditionalPageNavigationPaneAssetItemProps = {
  asset: TEditorAsset;
  assetSrc: string;
  assetDownloadSrc: string;
  page: TPageInstance;
};

export const AdditionalPageNavigationPaneAssetItem: React.FC<TAdditionalPageNavigationPaneAssetItemProps> = () => null;
