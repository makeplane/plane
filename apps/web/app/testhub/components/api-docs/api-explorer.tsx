/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { SearchIcon } from "@plane/propel/icons";
import { Tabs } from "@plane/propel/tabs";
import { testhubService } from "@plane/services";
import { Spinner } from "@plane/ui";
import { cn } from "@plane/utils";
import { testhubErrorMessage } from "../../helpers/error-message";
import { isSchemaMap, parseApiObjectSource, type TApiObjectDoc } from "../../helpers/parse-api-object";
import { TesthubListRow } from "../list-row";
import { MethodBadge } from "../method-badge";
import { JsonBlock } from "./json-block";
import { SchemaTable } from "./schema-table";

type TApiRow = { method: string; path: string; file: string; id?: string; name?: string };

type Props = {
  apis: TApiRow[];
  selectedFile: string;
  onSelect: (file: string) => void;
  loadFile?: (path: string) => Promise<{ content: string }>;
};

export function ApiExplorer({ apis, selectedFile, onSelect, loadFile }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apis;
    return apis.filter((row) => `${row.method} ${row.path} ${row.name ?? ""} ${row.file}`.toLowerCase().includes(q));
  }, [apis, query]);
  const groups = useMemo(() => groupApis(filtered), [filtered]);
  const selected = apis.find((row) => row.file === selectedFile) ?? filtered[0];
  const selectedPath = selected?.file;

  useEffect(() => {
    if (!selectedFile && selectedPath) onSelect(selectedPath);
  }, [onSelect, selectedFile, selectedPath]);

  if (!apis.length) {
    return (
      <div className="h-full w-full">
        <EmptyStateCompact
          assetKey="note"
          title={t("testhub.empty.no_apis")}
          description={t("testhub.empty.no_items")}
        />
      </div>
    );
  }

  return (
    <>
      <aside className="flex h-56 w-full shrink-0 flex-col overflow-hidden border-b border-subtle md:h-auto md:w-80 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 border-b border-subtle px-3 py-2">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-placeholder" />
          <input
            className="w-full border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
            placeholder={t("testhub.components.filter_apis")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="vertical-scrollbar scrollbar-sm min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-13 text-tertiary">{t("testhub.empty.no_results")}</p>
          ) : (
            groups.map((group) => (
              <ApiGroup
                key={group.key}
                group={group}
                selectedFile={selected?.file ?? ""}
                onSelect={onSelect}
                defaultOpen={Boolean(query) || group.rows.some((row) => row.file === selected?.file)}
              />
            ))
          )}
        </div>
      </aside>
      <section className="min-w-0 flex-1 overflow-hidden">
        {selected ? (
          <ApiDocPanel api={selected} loadFile={loadFile} />
        ) : (
          <EmptyStateCompact assetKey="search" title={t("testhub.components.no_selection")} />
        )}
      </section>
    </>
  );
}

function ApiGroup({
  group,
  selectedFile,
  onSelect,
  defaultOpen,
}: {
  group: { key: string; rows: TApiRow[] };
  selectedFile: string;
  onSelect: (file: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-12 font-medium text-secondary hover:bg-layer-1-hover"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-tertiary transition-transform", open && "rotate-90")} />
        <span className="truncate">{group.key}</span>
        <span className="ml-auto text-11 text-tertiary">{group.rows.length}</span>
      </button>
      {open
        ? group.rows.map((row) => (
            <TesthubListRow
              key={row.file}
              selected={row.file === selectedFile}
              onClick={() => onSelect(row.file)}
              className="min-h-10 border-b-0 pl-8"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MethodBadge method={row.method} />
                <span className="truncate text-primary">{leafPath(row.path)}</span>
              </span>
            </TesthubListRow>
          ))
        : null}
    </div>
  );
}

const fileCache = new Map<string, string>();

function fileCacheKey(workspaceSlug: string, projectId: string, path: string) {
  return `${workspaceSlug}:${projectId}:${path}`;
}

function ApiDocPanel({ api, loadFile }: { api: TApiRow; loadFile?: (path: string) => Promise<{ content: string }> }) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadErrorFallback = t("testhub.api.load_error");

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;
    const cacheKey = fileCacheKey(workspaceSlug, projectId, api.file);
    const cached = fileCache.get(cacheKey);
    if (cached) {
      setSource(cached);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    const fetcher = loadFile ? loadFile(api.file) : testhubService.getFile(workspaceSlug, projectId, api.file);
    fetcher
      .then((data) => {
        fileCache.set(cacheKey, data.content);
        if (!cancelled) setSource(data.content);
        return data;
      })
      .catch((err) => {
        if (!cancelled) {
          setSource("");
          setError(testhubErrorMessage(err, loadErrorFallback));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api.file, loadErrorFallback, loadFile, projectId, workspaceSlug]);

  const doc = useMemo(() => (source ? parseApiObjectSource(source) : {}), [source]);
  const method = doc.method || api.method;
  const path = doc.path || api.path;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-1 border-b border-subtle px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method={method} />
          <h2 className="truncate text-14 font-medium text-primary">{path || api.name || api.file}</h2>
        </div>
        <p className="truncate text-12 text-tertiary">
          {t("testhub.api.file")}: {api.file}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner height="24px" width="24px" />
          </div>
        ) : error ? (
          <p className="text-13 text-danger-primary">{error}</p>
        ) : (
          <Tabs defaultValue="docs" className="h-full">
            <Tabs.List className="w-auto max-w-md shrink-0">
              <Tabs.Trigger value="docs">{t("testhub.api.docs")}</Tabs.Trigger>
              <Tabs.Trigger value="request">{t("testhub.api.request")}</Tabs.Trigger>
              <Tabs.Trigger value="response">{t("testhub.api.response")}</Tabs.Trigger>
              <Tabs.Trigger value="source">{t("testhub.api.source")}</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="docs" className="vertical-scrollbar mt-3 scrollbar-sm h-full overflow-y-auto">
              <DocsTab doc={doc} />
            </Tabs.Content>
            <Tabs.Content value="request" className="vertical-scrollbar mt-3 scrollbar-sm h-full overflow-y-auto">
              <RequestTab doc={doc} />
            </Tabs.Content>
            <Tabs.Content value="response" className="vertical-scrollbar mt-3 scrollbar-sm h-full overflow-y-auto">
              <ResponseTab doc={doc} />
            </Tabs.Content>
            <Tabs.Content value="source" className="vertical-scrollbar mt-3 scrollbar-sm h-full overflow-y-auto">
              <JsonBlock value={source} />
            </Tabs.Content>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function DocsTab({ doc }: { doc: TApiObjectDoc }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pb-8">
      {doc.name ? <Field label={t("testhub.api.name")} value={doc.name} /> : null}
      {doc.id ? <Field label="ID" value={doc.id} /> : null}
      <section>
        <h3 className="mb-1 text-13 font-medium text-primary">{t("testhub.api.description")}</h3>
        <pre className="rounded-md bg-layer-1 p-3 text-12 whitespace-pre-wrap text-secondary">
          {doc.description?.trim() || t("testhub.api.none")}
        </pre>
      </section>
      <section>
        <h3 className="mb-1 text-13 font-medium text-primary">{t("testhub.api.auth")}</h3>
        {doc.authPolicy ? (
          <JsonBlock value={doc.authPolicy} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
      <section>
        <h3 className="mb-1 text-13 font-medium text-primary">{t("testhub.api.headers")}</h3>
        {doc.headersPolicy ? (
          <JsonBlock value={doc.headersPolicy} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
    </div>
  );
}

function RequestTab({ doc }: { doc: TApiObjectDoc }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pb-8">
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.query")}</h3>
        {isSchemaMap(doc.querySchema) ? (
          <SchemaTable fields={doc.querySchema} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.body")}</h3>
        {isSchemaMap(doc.bodySchema) ? (
          <SchemaTable fields={doc.bodySchema} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.recorded_query")}</h3>
        {doc.recordedQuery != null ? (
          <JsonBlock value={doc.recordedQuery} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.recorded_body")}</h3>
        {doc.recordedBody != null ? (
          <JsonBlock value={doc.recordedBody} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
    </div>
  );
}

function ResponseTab({ doc }: { doc: TApiObjectDoc }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pb-8">
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.asserts")}</h3>
        {doc.asserts?.length ? (
          <JsonBlock value={doc.asserts} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.extracts")}</h3>
        {doc.extracts?.length ? (
          <JsonBlock value={doc.extracts} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
      {doc.responseHints ? (
        <section>
          <h3 className="mb-2 text-13 font-medium text-primary">response_hints</h3>
          <JsonBlock value={doc.responseHints} />
        </section>
      ) : null}
      <section>
        <h3 className="mb-2 text-13 font-medium text-primary">{t("testhub.api.recorded_response")}</h3>
        {doc.recordedResponse != null ? (
          <JsonBlock value={doc.recordedResponse} />
        ) : (
          <p className="text-13 text-tertiary">{t("testhub.api.none")}</p>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-13">
      <span className="text-tertiary">{label}: </span>
      <span className="text-primary">{value}</span>
    </p>
  );
}

function groupApis(rows: TApiRow[]): Array<{ key: string; rows: TApiRow[] }> {
  const map = new Map<string, TApiRow[]>();
  for (const row of rows) {
    const key = groupKey(row.path || row.file);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([key, grouped]) => ({ key, rows: grouped }));
}

function groupKey(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 2) return path || "/";
  return `/${parts.slice(0, 2).join("/")}`;
}

function leafPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}
