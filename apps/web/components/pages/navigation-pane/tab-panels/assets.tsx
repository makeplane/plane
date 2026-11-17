/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { DownloadOutline } from "@makeplane/propel/icons";
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
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
      <div className="group/asset-item relative flex h-12 items-center gap-2 overflow-hidden rounded-sm border border-subtle pr-2 transition-colors hover:bg-layer-1">
        <a
          href={asset.href}
          className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset"
        >
          <div
            className="h-full w-11 shrink-0 border-r border-subtle bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${assetSrc}')`,
            }}
          />
          <p className="truncate text-body-xs-medium">{asset.name}</p>
        </a>
        <div className="pointer-events-none shrink-0 opacity-0 transition-opacity group-focus-within/asset-item:pointer-events-auto group-focus-within/asset-item:opacity-100 group-hover/asset-item:pointer-events-auto group-hover/asset-item:opacity-100">
          <a
            href={assetDownloadSrc}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-secondary outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-accent-strong"
          >
            <DownloadOutline className="size-3 shrink-0" />
            <span className="text-caption-sm-medium">{t("page_navigation_pane.tabs.assets.download_button")}</span>
          </a>
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
    <div className="flex size-full flex-col overflow-hidden">
      <ScrollArea orientation="vertical" visibility="auto" size="sm">
        <div className="space-y-4 px-4 pt-2">
          {assetsList?.map((asset) => (
            <AssetItem key={asset.id} asset={asset} page={page} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});
