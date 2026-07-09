/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FileText } from "lucide-react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import useSWR from "swr";
// plane imports
import { cn, getPageName } from "@plane/utils";
// hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";

type Props = {
  pageId: string;
  pageTitle: string;
  workspaceSlug: string;
  projectId: string;
};

export const PageEmbedCard = observer(function PageEmbedCard(props: Props) {
  const { pageId, pageTitle, workspaceSlug, projectId } = props;
  // store hooks
  const { getPageById, fetchPageDetails } = usePageStore(EPageStoreType.PROJECT);

  // Load the page so the card reflects its *current* title. The node's stored
  // `data-name` is only a creation-time snapshot ("Untitled"), so relying on it
  // leaves the card stale after the page is renamed. SWR dedupes across cards.
  useSWR(
    pageId && workspaceSlug && projectId ? `PAGE_EMBED_DETAILS_${workspaceSlug}_${projectId}_${pageId}` : null,
    pageId && workspaceSlug && projectId
      ? () => fetchPageDetails(workspaceSlug, projectId, pageId, { trackVisit: false })
      : null,
    { revalidateOnFocus: false }
  );

  if (!pageId) return null;

  const pageInstance = getPageById(pageId);
  // live title once loaded; fall back to the node snapshot while the fetch is in flight
  const title = pageInstance ? getPageName(pageInstance.name) : pageTitle || "Untitled";
  const href = `/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;

  return (
    <div contentEditable={false} className="my-1">
      <Link
        to={href}
        className={cn(
          "not-prose flex items-center gap-2 rounded-md border border-strong bg-layer-1 px-3 py-2",
          "text-13 font-medium text-primary no-underline transition-colors hover:bg-layer-transparent-hover"
        )}
      >
        <FileText className="size-4 flex-shrink-0 text-tertiary" />
        <span className="truncate">{title}</span>
      </Link>
    </div>
  );
});
