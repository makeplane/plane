/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@plane/utils";
import type { THelpArticleListItem, THelpCategory, THelpLocale } from "@/plane-web/types/help-center";
import { HelpCenterEmpty, HelpCenterError, HelpLoading } from "./help-center-states";

type Props = {
  currentLocale: THelpLocale;
  articles: THelpArticleListItem[];
  loading?: boolean;
  /** When true (and no articles), shows a retry state instead of the empty state. */
  error?: boolean;
  onRetry?: () => void;
  emptyLabel: string;
  /** Optional supporting line + illustration + recovery action for the empty state. */
  emptyDescription?: string;
  emptyAssetKey?: "search" | "inbox";
  emptyAction?: ReactNode;
  showMatchedLocale?: boolean;
  /** When provided, shows a small category badge on each row (useful for search results). */
  categoriesMap?: Record<string, THelpCategory>;
  /**
   * Keyboard-navigation support (search results): when set, the list becomes an
   * ARIA listbox, rows become options, and the row at activeIndex is highlighted.
   * `listboxId` ties row ids to the input's aria-activedescendant.
   */
  activeIndex?: number;
  listboxId?: string;
};

// Presentational list of article rows, reused for category browse and search
// results. A small locale tag is shown when a search matched a different locale.
// When categoriesMap is passed (search context), each row also shows its category.
// Links are workspace-agnostic (standalone /help).
export const ArticleList = ({
  currentLocale,
  articles,
  loading,
  error,
  onRetry,
  emptyLabel,
  emptyDescription,
  emptyAssetKey,
  emptyAction,
  showMatchedLocale,
  categoriesMap,
  activeIndex,
  listboxId,
}: Props) => {
  if (loading && articles.length === 0) return <HelpLoading />;
  if (error && articles.length === 0 && onRetry) return <HelpCenterError onRetry={onRetry} />;
  if (articles.length === 0)
    return (
      <HelpCenterEmpty
        title={emptyLabel}
        description={emptyDescription}
        assetKey={emptyAssetKey}
        action={emptyAction}
      />
    );

  const isListbox = activeIndex !== undefined;

  return (
    <ul
      id={isListbox ? listboxId : undefined}
      role={isListbox ? "listbox" : undefined}
      className="divide-y divide-subtle overflow-hidden rounded-lg border border-subtle bg-surface-1"
    >
      {articles.map((article, index) => {
        const crossLocale = showMatchedLocale && article.matched_locale && article.matched_locale !== currentLocale;
        const categoryName = categoriesMap && article.category ? categoriesMap[article.category]?.name : null;
        const isActive = isListbox && index === activeIndex;
        return (
          <li
            key={article.id}
            id={isListbox && listboxId ? `${listboxId}-${index}` : undefined}
            role={isListbox ? "option" : undefined}
            aria-selected={isListbox ? isActive : undefined}
          >
            <Link
              to={`/help/a/${article.slug}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong",
                isActive && "bg-surface-2"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-14 font-medium text-primary">{article.title ?? article.slug}</span>
                  {crossLocale && (
                    <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-10 font-semibold uppercase text-tertiary">
                      {article.matched_locale}
                    </span>
                  )}
                </div>
                {article.snippet && <p className="mt-0.5 line-clamp-2 text-13 text-tertiary">{article.snippet}</p>}
                {/* Category badge — shown in search results to orient the user */}
                {categoryName && (
                  <span className="mt-1 inline-block rounded bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
                    {categoryName}
                  </span>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-icon-primary" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
