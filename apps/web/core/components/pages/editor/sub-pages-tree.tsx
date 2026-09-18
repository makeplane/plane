/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, PageIcon } from "@plane/propel/icons";
import { cn, getPageName } from "@plane/utils";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";
import { usePageStore } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

// guards against malformed (cyclic) hierarchies
const MAX_TREE_DEPTH = 20;

type Props = {
  page: TPageInstance;
  projectId: string | undefined;
  workspaceSlug: string;
  storeType: EPageStoreType;
  className?: string;
};

/**
 * @description the sub-pages of the page being viewed, collapsed to a single line until expanded
 */
export const PageSubPagesTree = observer(function PageSubPagesTree(props: Props) {
  const { page, projectId, workspaceSlug, storeType, className } = props;
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());
  // store hooks
  const { getCurrentProjectPageIds, getPageById } = usePageStore(storeType);
  // derived values
  const pageIds = projectId
    ? getCurrentProjectPageIds(projectId).filter((pageId) => !getPageById(pageId)?.archived_at)
    : [];
  const childPageIdsByParentId: Record<string, string[]> = {};
  for (const pageId of pageIds) {
    const parentId = getPageById(pageId)?.parent;
    if (parentId && parentId !== pageId) (childPageIdsByParentId[parentId] ??= []).push(pageId);
  }
  const childPageIds = page.id ? (childPageIdsByParentId[page.id] ?? []) : [];

  if (childPageIds.length === 0) return null;

  const toggleExpanded = (pageId: string) =>
    setExpandedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });

  const renderTree = (currentPageIds: string[], depth: number): ReactNode[] =>
    currentPageIds.flatMap((pageId) => {
      const subPage = getPageById(pageId);
      if (!subPage) return [];
      const grandChildPageIds = childPageIdsByParentId[pageId] ?? [];
      const isPageExpanded = expandedPageIds.has(pageId) && depth < MAX_TREE_DEPTH;
      return [
        <div key={pageId} className="flex items-center gap-1" style={{ paddingLeft: `${depth * 14}px` }}>
          <button
            type="button"
            className={cn("group/sub-page grid size-4 flex-shrink-0 place-items-center text-tertiary", {
              "cursor-default": grandChildPageIds.length === 0,
            })}
            onClick={() => grandChildPageIds.length > 0 && toggleExpanded(pageId)}
            aria-label={isPageExpanded ? "Collapse sub-pages" : "Expand sub-pages"}
            tabIndex={grandChildPageIds.length === 0 ? -1 : 0}
          >
            {grandChildPageIds.length > 0 ? (
              <ChevronRightIcon className={cn("size-3.5", { "rotate-90": isPageExpanded })} />
            ) : subPage.logo_props?.in_use ? (
              <Logo logo={subPage.logo_props} size={12} type="lucide" />
            ) : (
              <PageIcon className="size-3 text-placeholder" />
            )}
          </button>
          <Link
            to={`/${workspaceSlug}/projects/${projectId}/pages/${pageId}?from=${page.id}`}
            className="truncate rounded-sm px-1 py-0.5 text-11 text-secondary hover:bg-layer-transparent-hover hover:text-primary"
          >
            {getPageName(subPage.name)}
          </Link>
        </div>,
        ...(isPageExpanded ? renderTree(grandChildPageIds, depth + 1) : []),
      ];
    });

  return (
    <div className={cn("text-11", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-1 rounded-sm py-0.5 text-11 text-placeholder hover:text-tertiary"
      >
        <ChevronRightIcon className={cn("size-3.5 transition-transform", { "rotate-90": isExpanded })} />
        {childPageIds.length} {childPageIds.length === 1 ? "sub-page" : "sub-pages"}
      </button>
      {isExpanded && <div className="mt-0.5 space-y-0.5">{renderTree(childPageIds, 0)}</div>}
    </div>
  );
});
