/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";
import { FilePreviewButton } from "../components/file-preview";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function KnowledgePage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [query, setQuery] = useState("");
  const base = `/${workspaceSlug}/projects/${projectId}/testhub`;

  if (loading) return <p className="text-13 text-secondary">…</p>;
  if (!catalog?.repo) return <TesthubUnbound href={`${base}/bind`} />;

  const knowledge = catalog.snapshot?.payload?.knowledge;
  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full max-w-md"
        placeholder={t("testhub.knowledge.filter")}
      />
      <section>
        <h2 className="mb-2 text-14 font-medium text-primary">{t("testhub.knowledge.ddl")}</h2>
        <div className="space-y-3">
          {(knowledge?.ddl ?? []).map((block) => {
            const tables = q ? block.tables.filter((table) => table.toLowerCase().includes(q)) : block.tables;
            return (
              <div key={block.datasource} className="rounded-md bg-layer-1 p-3">
                <p className="mb-2 text-13 text-primary">
                  {block.datasource} · {block.table_count}
                </p>
                <ul className="max-h-80 space-y-1 overflow-auto">
                  {tables.map((table) => (
                    <li key={table} className="flex items-center justify-between gap-2 text-13 text-secondary">
                      <span>{table}</span>
                      <FilePreviewButton path={`${block.path}/${table}`} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-14 font-medium text-primary">{t("testhub.knowledge.sql")}</h2>
        <ul className="space-y-1">
          {(knowledge?.sql_files ?? [])
            .filter((file) => !q || file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q))
            .map((file) => (
              <li key={file.path} className="flex items-center justify-between gap-2 rounded-md bg-layer-1 px-3 py-2">
                <span className="text-13 text-primary">{file.name}</span>
                <FilePreviewButton path={file.path} />
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

export default observer(KnowledgePage);
