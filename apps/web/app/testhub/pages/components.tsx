/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";
import { FilePreviewButton } from "../components/file-preview";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function ComponentsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [query, setQuery] = useState("");
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  const apiObjects = catalog?.snapshot?.payload?.components?.api_objects;
  const words = catalog?.snapshot?.payload?.components?.action_words ?? [];
  const filteredApis = useMemo(
    () =>
      (apiObjects ?? []).filter((row) =>
        `${row.method} ${row.path} ${row.name ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [apiObjects, query]
  );

  if (loading) return <p className="text-13 text-secondary">…</p>;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-14 font-medium text-primary">{t("testhub.components.api_objects")}</h2>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mb-2 w-full max-w-md"
          placeholder={t("testhub.components.filter")}
        />
        <ul className="max-h-[420px] space-y-1 overflow-auto">
          {filteredApis.map((row) => (
            <li key={row.file} className="flex items-center justify-between gap-2 rounded-md bg-layer-1 px-3 py-2">
              <span className="text-13 text-primary">
                <span className="text-tertiary">{row.method}</span> {row.path}
              </span>
              <FilePreviewButton path={row.file} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-14 font-medium text-primary">{t("testhub.components.action_words")}</h2>
        <div className="space-y-2">
          {words.map((word) => (
            <details key={word.word_id} className="rounded-md bg-layer-1 p-3">
              <summary className="cursor-pointer text-13 text-primary">
                {word.word_id} · {word.name} · {word.category}
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-layer-2 p-2 text-12 text-secondary">
                {JSON.stringify(word.params_schema ?? {}, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-14 font-medium text-primary">{t("testhub.components.page_objects")}</h2>
        <ul className="space-y-1">
          {(catalog.snapshot?.payload?.components?.page_objects ?? []).map((row) => (
            <li key={row.path} className="rounded-md bg-layer-1 px-3 py-2 text-13 text-primary">
              {row.name}
              <span className="ml-2 text-tertiary">{row.path}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default observer(ComponentsPage);
