/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Input } from "@plane/ui";
import { FilePreviewButton } from "../components/file-preview";
import { TesthubListRow } from "../components/list-row";
import { TesthubPageBody, TesthubPageLoader } from "../components/page-shell";
import { TesthubUnbound } from "../components/unbound";
import type { TTesthubOutletContext } from "../layout";

function SqlPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TTesthubOutletContext>();
  const [query, setQuery] = useState("");
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  const sqlFiles = useMemo(() => {
    const files = catalog?.snapshot?.payload?.knowledge?.sql_files ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) => file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q));
  }, [catalog, query]);

  if (loading) return <TesthubPageLoader />;
  if (!catalog?.repo) return <TesthubUnbound href={configHref} />;

  return (
    <TesthubPageBody>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-3 w-full max-w-md"
        placeholder={t("testhub.knowledge.filter")}
      />
      {sqlFiles.length ? (
        <div className="overflow-hidden rounded-md border border-subtle">
          {sqlFiles.map((file) => (
            <TesthubListRow key={file.path}>
              <span className="truncate text-primary">{file.name}</span>
              <FilePreviewButton path={file.path} showCopy />
            </TesthubListRow>
          ))}
        </div>
      ) : (
        <EmptyStateCompact assetKey="search" title={t("testhub.empty.no_results")} />
      )}
    </TesthubPageBody>
  );
}

export default observer(SqlPage);
