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
import { TesthubPageBody, TesthubPageLoader } from "@/app/testhub/components/page-shell";
import { TesthubUnbound } from "@/app/testhub/components/unbound";
import type { TFormulationOutletContext } from "../layout";

function ActionWordsPage() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { catalog, loading } = useOutletContext<TFormulationOutletContext>();
  const [wordQuery, setWordQuery] = useState("");
  const configHref = `/${workspaceSlug}/projects/${projectId}/gitsync`;

  const filteredWords = useMemo(() => {
    const actionWords = catalog?.payload?.components?.action_words ?? [];
    const q = wordQuery.trim().toLowerCase();
    if (!q) return actionWords;
    return actionWords.filter((word) => `${word.word_id} ${word.name} ${word.category}`.toLowerCase().includes(q));
  }, [wordQuery, catalog]);

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

  return (
    <TesthubPageBody>
      <Input
        value={wordQuery}
        onChange={(event) => setWordQuery(event.target.value)}
        className="mb-3 w-full max-w-md"
        placeholder={t("formulation.filter_words")}
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
        <EmptyStateCompact assetKey="search" title={t("formulation.empty")} />
      )}
    </TesthubPageBody>
  );
}

export default observer(ActionWordsPage);
