/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { THelpArticleListItem, THelpLocale } from "@/plane-web/types/help-center";
import { HelpCenterEmpty, HelpLoading } from "./help-center-states";

type Props = {
  workspaceSlug: string;
  currentLocale: THelpLocale;
  articles: THelpArticleListItem[];
  loading?: boolean;
  emptyLabel: string;
  showMatchedLocale?: boolean;
};

// Presentational list of article rows, reused for category browse and search
// results. A small locale tag is shown when a search matched a different locale.
export const ArticleList = ({
  workspaceSlug,
  currentLocale,
  articles,
  loading,
  emptyLabel,
  showMatchedLocale,
}: Props) => {
  if (loading && articles.length === 0) return <HelpLoading />;
  if (articles.length === 0) return <HelpCenterEmpty title={emptyLabel} />;

  return (
    <ul className="divide-y divide-subtle overflow-hidden rounded-lg border border-subtle bg-surface-1">
      {articles.map((article) => {
        const crossLocale = showMatchedLocale && article.matched_locale && article.matched_locale !== currentLocale;
        return (
          <li key={article.id}>
            <Link
              to={`/${workspaceSlug}/help/a/${article.slug}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
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
                {article.snippet && <p className="mt-0.5 line-clamp-1 text-13 text-tertiary">{article.snippet}</p>}
              </div>
              <ChevronRight className="size-4 shrink-0 text-icon-primary" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
