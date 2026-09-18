/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronRightIcon, PageIcon } from "@plane/propel/icons";
import { cn, getPageName } from "@plane/utils";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";

// guards against malformed (cyclic) hierarchies
const MAX_TREE_DEPTH = 20;

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * @description the project's page hierarchy, shown when the sidebar's Pages item is expanded
 */
export const SidebarPagesTree = observer(function SidebarPagesTree(props: Props) {
  const { workspaceSlug, projectId } = props;
  // states
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(new Set());
  // store hooks
  const { getCurrentProjectPageIds, getPageById, fetchPagesList } = usePageStore(EPageStoreType.PROJECT);
  // fetch the project's pages once the tree is shown
  useSWR(`SIDEBAR_PROJECT_PAGES_${projectId}`, () => fetchPagesList(workspaceSlug, projectId), {
    revalidateOnFocus: false,
  });
  // derived values
  const pageIds = getCurrentProjectPageIds(projectId).filter((pageId) => !getPageById(pageId)?.archived_at);

  // build the tree, a page whose parent isn't here is shown at the top level
  const visiblePageIds = new Set(pageIds);
  const childPageIdsByParentId: Record<string, string[]> = {};
  const rootPageIds: string[] = [];
  for (const pageId of pageIds) {
    const parentId = getPageById(pageId)?.parent;
    if (parentId && parentId !== pageId && visiblePageIds.has(parentId)) {
      (childPageIdsByParentId[parentId] ??= []).push(pageId);
    } else rootPageIds.push(pageId);
  }

  const toggleExpanded = (pageId: string) =>
    setExpandedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });

  const renderTree = (currentPageIds: string[], depth: number): ReactNode[] =>
    currentPageIds.flatMap((pageId) => {
      const page = getPageById(pageId);
      if (!page) return [];
      const childPageIds = childPageIdsByParentId[pageId] ?? [];
      const hasChildren = childPageIds.length > 0;
      const isExpanded = expandedPageIds.has(pageId) && depth < MAX_TREE_DEPTH;
      return [
        <div key={pageId} className="flex items-center gap-1" style={{ paddingLeft: `${depth * 10}px` }}>
          {/* the page icon turns into the chevron on hover, so expanding costs no extra width */}
          <button
            type="button"
            className={cn("group/page-toggle grid size-4 flex-shrink-0 place-items-center text-placeholder", {
              "cursor-default": !hasChildren,
              "hover:text-tertiary": hasChildren,
            })}
            onClick={() => hasChildren && toggleExpanded(pageId)}
            aria-label={isExpanded ? "Collapse sub-pages" : "Expand sub-pages"}
            tabIndex={hasChildren ? 0 : -1}
          >
            <span
              className={cn("grid place-items-center", {
                "group-hover/page-toggle:hidden": hasChildren,
                hidden: hasChildren && isExpanded,
              })}
            >
              {page.logo_props?.in_use ? (
                <Logo logo={page.logo_props} size={12} type="lucide" />
              ) : (
                <PageIcon className="size-3.5 flex-shrink-0" />
              )}
            </span>
            {hasChildren && (
              <ChevronRightIcon
                className={cn("hidden size-3.5 group-hover/page-toggle:block", {
                  "block rotate-90": isExpanded,
                })}
              />
            )}
          </button>
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/pages/${pageId}`}
            className="min-w-0 flex-1 truncate rounded-sm px-1 py-0.5 text-11 font-medium text-secondary hover:bg-layer-transparent-hover hover:text-primary"
          >
            {getPageName(page.name)}
          </Link>
        </div>,
        ...(isExpanded ? renderTree(childPageIds, depth + 1) : []),
      ];
    });

  if (pageIds.length === 0) return <p className="py-0.5 pl-6 text-11 text-placeholder">No pages yet</p>;

  return <div className="space-y-0.5 pl-3">{renderTree(rootPageIds, 0)}</div>;
});
