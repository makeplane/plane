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
import { TesthubPageBody, TesthubPageLoader } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

function DdlPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TFormulationOutletContext>();
  const [query, setQuery] = useState("");
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.remote) {
    return (
      <TesthubUnbound
        href={configHref}
        title={t("formulation.unbound")}
        description={t("formulation.unbound_description")}
        cta={t("formulation.cta")}
      />
    );
  }

  const ddl = catalog.payload?.knowledge?.ddl ?? [];
  const q = query.trim().toLowerCase();
  const blocks = ddl.filter(
    (block) =>
      !q || block.datasource.toLowerCase().includes(q) || block.tables.some((table) => table.toLowerCase().includes(q))
  );

  return (
    <TesthubPageBody>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-3 w-full max-w-md"
        placeholder={t("formulation.filter_ddl")}
      />
      {blocks.length ? (
        <div className="space-y-3">
          {blocks.map((block) => {
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
                      <FilePreviewButton path={`${block.path}/${table}.sql`} moduleKey="features" />
                    </TesthubListRow>
                  ))
                ) : (
                  <p className="px-3 py-3 text-13 text-tertiary">{t("formulation.empty")}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyStateCompact assetKey="search" title={t("formulation.empty")} />
      )}
    </TesthubPageBody>
  );
}

export default observer(DdlPage);
