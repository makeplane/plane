/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Input } from "@plane/ui";
import { FilePreviewButton } from "@/app/testhub/components/file-preview";
import { TesthubListRow } from "@/app/testhub/components/list-row";
import { TesthubPageBody, TesthubPageLoader, TesthubSectionTitle } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TEnvironmentsOutletContext } from "../layout";

function SchemaPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TEnvironmentsOutletContext>();
  const [query, setQuery] = useState("");
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.remote) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("environments.unbound")}
        description={t("environments.unbound_description")}
        cta={t("environments.cta")}
      />
    );
  }

  const knowledge = catalog.payload?.knowledge;
  const q = query.trim().toLowerCase();
  const sqlFiles = (knowledge?.sql_files ?? []).filter(
    (file) => !q || file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q)
  );

  return (
    <TesthubPageBody>
      <div className="space-y-6">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full max-w-md"
          placeholder={t("environments.filter")}
        />
        <section>
          <TesthubSectionTitle>{t("environments.ddl")}</TesthubSectionTitle>
          <div className="space-y-3">
            {(knowledge?.ddl ?? []).map((block) => {
              const tables = q ? block.tables.filter((table) => table.toLowerCase().includes(q)) : block.tables;
              return (
                <div key={block.datasource} className="overflow-hidden rounded-md border border-subtle">
                  <p className="border-b border-subtle bg-layer-1 px-3 py-2 text-13 text-primary">
                    {block.datasource} · {block.table_count}
                  </p>
                  {tables.length ? (
                    tables.map((table) => (
                      <TesthubListRow key={table}>
                        <span className="truncate text-primary">{table}</span>
                        <FilePreviewButton path={`${block.path}/${table}.sql`} moduleKey="environments" />
                      </TesthubListRow>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-13 text-tertiary">{t("environments.no_results")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <section>
          <TesthubSectionTitle>{t("environments.sql")}</TesthubSectionTitle>
          {sqlFiles.length ? (
            <div className="overflow-hidden rounded-md border border-subtle">
              {sqlFiles.map((file) => (
                <TesthubListRow key={file.path}>
                  <span className="truncate text-primary">{file.name}</span>
                  <FilePreviewButton path={file.path} moduleKey="environments" />
                </TesthubListRow>
              ))}
            </div>
          ) : (
            <EmptyStateCompact assetKey="search" title={t("environments.no_results")} />
          )}
        </section>
      </div>
    </TesthubPageBody>
  );
}

export default observer(SchemaPage);
