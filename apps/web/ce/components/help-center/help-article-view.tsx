/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";
import type { THelpArticleDetail } from "@/plane-web/types/help-center";
import { HelpArticleFooter } from "./help-article-footer";
import { HelpArticleToc } from "./help-article-toc";
import { HelpArticleMissing, HelpContentUnavailable, HelpLoading } from "./help-center-states";
import { HelpContentRenderer } from "./help-content-renderer";
import { LocaleFallbackNotice } from "./locale-fallback-notice";
import { useHelpArticleHeadings } from "./use-help-article-headings";

type TStatus = "loading" | "ready" | "notfound";

// Article detail page. Deep-linked by slug; re-fetches on locale switch with a
// request-sequence guard so a superseded (older-locale) response can't overwrite
// the content for the locale the user is now viewing.
export const HelpArticleView = observer(function HelpArticleView({ articleSlug }: { articleSlug: string }) {
  const { t, currentLocale } = useTranslation();
  const { article: store } = useHelpCenter();
  const [detail, setDetail] = useState<THelpArticleDetail | null>(null);
  const [status, setStatus] = useState<TStatus>("loading");
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // One observer feeds both the desktop sidebar and the mobile TOC disclosure.
  const toc = useHelpArticleHeadings(contentRef, detail?.description_html ?? "");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    void (async () => {
      try {
        const res = await store.fetchArticleBySlug(articleSlug, currentLocale);
        if (cancelled) return;
        setDetail(res);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store, articleSlug, currentLocale]);

  // On article change, reset the scroll position and move focus to the title.
  // A SPA route swap otherwise leaves keyboard/SR focus on the old link with no
  // announcement that new content loaded.
  useEffect(() => {
    if (status !== "ready") return;
    document.getElementById("help-main-content")?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [articleSlug, status]);

  if (status === "loading") return <HelpLoading />;
  if (status === "notfound" || !detail) return <HelpArticleMissing />;

  const fellBack = !!detail.resolved_locale && detail.resolved_locale !== currentLocale;
  const hasContent = !!detail.title && !!detail.description_html;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <PageHead title={detail.title ?? t("help_center.title")} />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
        <article className="min-w-0">
          {fellBack && detail.resolved_locale && <LocaleFallbackNotice resolvedLocale={detail.resolved_locale} />}
          {/* arbitrary size: the project's font scale has no text-3xl token, so an
              explicit 1.75rem keeps the title clearly above the 1.5rem content H2 */}
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mb-4 text-[1.75rem] font-semibold leading-tight text-primary outline-none"
          >
            {detail.title ?? detail.slug}
          </h1>
          {hasContent && detail.description_html ? (
            <>
              {/* Mobile-only jump list (desktop uses the sticky sidebar below) */}
              <HelpArticleToc variant="mobile" className="mb-6 lg:hidden" {...toc} />
              <div ref={contentRef}>
                <HelpContentRenderer articleId={detail.id} descriptionHtml={detail.description_html} />
              </div>
            </>
          ) : (
            <HelpContentUnavailable />
          )}
          <HelpArticleFooter currentLocale={currentLocale} article={detail} />
        </article>
        {hasContent && detail.description_html && (
          <aside className="hidden lg:block">
            <HelpArticleToc {...toc} />
          </aside>
        )}
      </div>
    </div>
  );
});
