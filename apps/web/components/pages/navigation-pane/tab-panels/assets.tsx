/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AnchorButton } from "@makeplane/propel/elements/anchor-button";
import { DownloadOutline } from "@makeplane/propel/icons";
// plane imports
import { CORE_EXTENSIONS } from "@plane/editor";
import type { TEditorAsset } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { getEditorAssetDownloadSrc, getEditorAssetSrc } from "@plane/utils";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local import
import { PageNavigationPaneAssetsTabEmptyState } from "./empty-state/assets";

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
      <div className="group/asset-item relative flex h-12 items-center gap-2 rounded-sm border border-subtle pr-2 transition-colors hover:bg-layer-1">
        <a
          href={asset.href}
          className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-1"
        >
          <div
            className="h-12 w-11 flex-shrink-0 rounded-l-sm bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${assetSrc}')`,
            }}
          />
          <p className="truncate text-13 font-medium">{asset.name}</p>
        </a>
        <div className="pointer-events-none shrink-0 opacity-0 transition-opacity group-focus-within/asset-item:pointer-events-auto group-focus-within/asset-item:opacity-100 group-hover/asset-item:pointer-events-auto group-hover/asset-item:opacity-100">
          <AnchorButton href={assetDownloadSrc} target="_blank" rel="noreferrer noopener" variant="secondary" size="xs">
            <DownloadOutline className="size-3 shrink-0" />
            <span>{t("page_navigation_pane.tabs.assets.download_button")}</span>
          </AnchorButton>
        </div>
      </div>
    );

  return null;
});

export const PageNavigationPaneAssetsTabPanel = observer(function PageNavigationPaneAssetsTabPanel(props: Props) {
  const { page } = props;
  // derived values
  const {
    editor: { assetsList },
  } = page;

  if (assetsList.length === 0) return <PageNavigationPaneAssetsTabEmptyState />;

  return (
    <div className="mt-5 space-y-4 px-4">
      {assetsList?.map((asset) => (
        <AssetItem key={asset.id} asset={asset} page={page} />
      ))}
    </div>
  );
});
