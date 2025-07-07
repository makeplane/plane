"use client";

import { observer } from "mobx-react";
// components
import { PageOptionsDropdown } from "@/components/pages";
// plane web components
import { PageLockControl } from "@/plane-web/components/pages/header/lock-control";
import { PageMoveControl } from "@/plane-web/components/pages/header/move-control";
import { PageShareControl } from "@/plane-web/components/pages/header/share-control";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageArchivedBadge } from "./archived-badge";
import { PageCopyLinkControl } from "./copy-link-control";
import { PageFavoriteControl } from "./favorite-control";
import { PageOfflineBadge } from "./offline-badge";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageHeaderActions: React.FC<Props> = observer((props) => {
  const { page, storeType } = props;

  return (
    <div className="flex items-center gap-1">
      <PageArchivedBadge page={page} />
      <PageOfflineBadge page={page} />
      <PageLockControl page={page} />
      <PageMoveControl page={page} />
      <PageCopyLinkControl page={page} />
      <PageFavoriteControl page={page} />
      <PageShareControl page={page} storeType={storeType} />
      <PageOptionsDropdown page={page} storeType={storeType} />
    </div>
  );
});
