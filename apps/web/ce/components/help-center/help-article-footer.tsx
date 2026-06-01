/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";
import type { THelpArticleDetail, THelpLocale } from "@/plane-web/types/help-center";

type Props = { currentLocale: THelpLocale; article: THelpArticleDetail };

// Cross-article navigation: prev/next siblings within the same category
// (by sort_order) + a short "more in this category" list. Derived from the
// category article list — no extra dedicated endpoint. Links are workspace-agnostic
// (standalone /help).
export const HelpArticleFooter = observer(function HelpArticleFooter({ currentLocale, article }: Props) {
  const { t } = useTranslation();
  const { article: store } = useHelpCenter();
  const categoryId = article.category;

  useEffect(() => {
    if (categoryId) void store.fetchArticles({ category: categoryId, locale: currentLocale });
  }, [store, categoryId, currentLocale]);

  if (!categoryId) return null;

  const siblings = store.getArticlesByCategory(categoryId);
  const currentIndex = siblings.findIndex((item) => item.id === article.id);
  const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
  const related = siblings.filter((item) => item.id !== article.id).slice(0, 5);

  if (!prev && !next && related.length === 0) return null;

  return (
    <footer className="mt-10 border-t border-subtle pt-6">
      {(prev || next) && (
        <div className="flex items-stretch justify-between gap-4">
          {prev ? (
            <Link
              to={`/help/a/${prev.slug}`}
              className="flex flex-1 items-center gap-2 rounded-md border border-subtle bg-surface-1 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
            >
              <ChevronLeft className="size-4 shrink-0 text-icon-primary" />
              <span className="truncate text-13 text-secondary">{prev.title ?? prev.slug}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              to={`/help/a/${next.slug}`}
              className="flex flex-1 items-center justify-end gap-2 rounded-md border border-subtle bg-surface-1 px-4 py-3 text-right transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
            >
              <span className="truncate text-13 text-secondary">{next.title ?? next.slug}</span>
              <ChevronRight className="size-4 shrink-0 text-icon-primary" />
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      )}
      {related.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-13 font-semibold text-secondary">{t("help_center.more_in_category")}</p>
          <ul className="space-y-1">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/help/a/${item.slug}`}
                  className="rounded text-13 text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
                >
                  {item.title ?? item.slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </footer>
  );
});
