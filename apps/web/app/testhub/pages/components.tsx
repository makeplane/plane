/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams, useSearchParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Tabs } from "@plane/propel/tabs";
import { Input } from "@plane/ui";
import { ApiExplorer } from "../components/api-docs/api-explorer";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle, TesthubSplitBody } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

const COMPONENT_TABS = ["apis", "words", "pages"] as const;
type TComponentTab = (typeof COMPONENT_TABS)[number];

function ComponentsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [wordQuery, setWordQuery] = useState("");
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  const tabParam = searchParams.get("tab");
  const tab: TComponentTab = COMPONENT_TABS.includes(tabParam as TComponentTab) ? (tabParam as TComponentTab) : "apis";
  const selectedFile = searchParams.get("api") ?? "";

  const apiObjects = catalog?.snapshot?.payload?.components?.api_objects ?? [];
  const actionWords = catalog?.snapshot?.payload?.components?.action_words;
  const pageObjects = catalog?.snapshot?.payload?.components?.page_objects ?? [];
  const filteredWords = useMemo(() => {
    const words = actionWords ?? [];
    const q = wordQuery.trim().toLowerCase();
    if (!q) return words;
    return words.filter((word) => `${word.word_id} ${word.name} ${word.category}`.toLowerCase().includes(q));
  }, [wordQuery, actionWords]);

  const setTab = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", value);
          if (value !== "apis") next.delete("api");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setApi = useCallback(
    (file: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", "apis");
          next.set("api", file);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-subtle px-page-x py-2">
        <Tabs value={tab} onValueChange={setTab} className="h-auto">
          <Tabs.List className="max-w-md">
            <Tabs.Trigger value="apis">{t("testhub.components.tab_apis")}</Tabs.Trigger>
            <Tabs.Trigger value="words">{t("testhub.components.tab_words")}</Tabs.Trigger>
            <Tabs.Trigger value="pages">{t("testhub.components.tab_pages")}</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>
      {tab === "apis" ? (
        <TesthubSplitBody>
          <ApiExplorer apis={apiObjects} selectedFile={selectedFile} onSelect={setApi} />
        </TesthubSplitBody>
      ) : null}
      {tab === "words" ? (
        <TesthubPageBody>
          <Input
            value={wordQuery}
            onChange={(event) => setWordQuery(event.target.value)}
            className="mb-3 w-full max-w-md"
            placeholder={t("testhub.components.filter_words")}
          />
          {filteredWords.length ? (
            <div className="space-y-2">
              {filteredWords.map((word) => (
                <details key={word.word_id} className="rounded-md border border-subtle bg-layer-1 p-3">
                  <summary className="cursor-pointer text-13 text-primary">
                    {word.word_id} · {word.name} · {word.category}
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-layer-2 p-2 text-12 text-secondary">
                    {JSON.stringify(word.params_schema ?? {}, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          ) : (
            <EmptyStateCompact assetKey="search" title={t("testhub.empty.no_results")} />
          )}
        </TesthubPageBody>
      ) : null}
      {tab === "pages" ? (
        <TesthubPageBody>
          <TesthubSectionTitle>{t("testhub.components.page_objects")}</TesthubSectionTitle>
          {pageObjects.length ? (
            <div className="overflow-hidden rounded-md border border-subtle">
              {pageObjects.map((row) => (
                <TesthubListRow key={row.path}>
                  <span className="truncate text-primary">
                    {row.name}
                    <span className="ml-2 text-tertiary">{row.path}</span>
                  </span>
                </TesthubListRow>
              ))}
            </div>
          ) : (
            <EmptyStateCompact assetKey="note" title={t("testhub.empty.no_items")} />
          )}
        </TesthubPageBody>
      ) : null}
    </div>
  );
}

export default observer(ComponentsPage);
