/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
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

type TStatus = "loading" | "ready" | "notfound";

// Article detail page. Deep-linked by slug; re-fetches on locale switch with a
// request-sequence guard so a superseded (older-locale) response can't overwrite
// the content for the locale the user is now viewing.
export const HelpArticleView = observer(function HelpArticleView({ articleSlug }: { articleSlug: string }) {
  const { t, currentLocale } = useTranslation();
  const { workspaceSlug } = useParams();
  const { article: store } = useHelpCenter();
  const [detail, setDetail] = useState<THelpArticleDetail | null>(null);
  const [status, setStatus] = useState<TStatus>("loading");
  const contentRef = useRef<HTMLDivElement>(null);
  const ws = workspaceSlug?.toString() ?? "";

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

  if (status === "loading") return <HelpLoading />;
  if (status === "notfound" || !detail) return <HelpArticleMissing workspaceSlug={ws} />;

  const fellBack = !!detail.resolved_locale && detail.resolved_locale !== currentLocale;
  const hasContent = !!detail.title && !!detail.description_html;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <PageHead title={detail.title ?? t("help_center.title")} />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
        <article className="min-w-0">
          {fellBack && detail.resolved_locale && <LocaleFallbackNotice resolvedLocale={detail.resolved_locale} />}
          <h1 className="mb-4 text-2xl font-semibold text-primary">{detail.title ?? detail.slug}</h1>
          {hasContent && detail.description_html ? (
            <div ref={contentRef}>
              <HelpContentRenderer workspaceSlug={ws} articleId={detail.id} descriptionHtml={detail.description_html} />
            </div>
          ) : (
            <HelpContentUnavailable />
          )}
          <HelpArticleFooter workspaceSlug={ws} currentLocale={currentLocale} article={detail} />
        </article>
        {hasContent && detail.description_html && (
          <aside className="hidden lg:block">
            <HelpArticleToc html={detail.description_html} contentRef={contentRef} />
          </aside>
        )}
      </div>
    </div>
  );
});
