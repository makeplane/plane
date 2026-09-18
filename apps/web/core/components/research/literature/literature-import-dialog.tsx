/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";

type Props = {
  onImport: (payload: {
    format: string;
    content: string;
  }) => Promise<{ created: number; skipped: number; failed: number }>;
};

/**
 * Bulk import: DOI list or BibTeX, with a per-row result summary. Nothing is
 * rolled back on failure - the researcher sees exactly what landed (P1-LIT-07).
 */
export const LiteratureImportDialog = observer(function LiteratureImportDialog({ onImport }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState("doi");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number; failed: number } | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = useCallback(async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      const summary = await onImport({ format, content });
      setResult(summary);
      setContent("");
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [content, format, onImport]);

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {t("research.literature.import")}
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded border border-subtle p-3">
      <div className="flex items-center gap-2">
        {(["doi", "bibtex"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFormat(value)}
            className={`rounded px-2 py-1 text-12 ${format === value ? "bg-surface-2 text-primary" : "text-tertiary"}`}
          >
            {t(`research.literature.import_format.${value}`)}
          </button>
        ))}
      </div>
      <textarea
        className="min-h-24 w-full rounded border border-subtle bg-surface-1 p-2 text-12 text-primary"
        value={content}
        placeholder={t(
          format === "bibtex" ? "research.literature.import_bibtex_hint" : "research.literature.import_doi_hint"
        )}
        onChange={(event) => setContent(event.target.value)}
      />
      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}
      {result && (
        <p className="text-12 text-secondary">
          {t("research.literature.import_result", {
            created: result.created,
            skipped: result.skipped,
            failed: result.failed,
          })}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="primary" disabled={busy || !content.trim()} onClick={() => void handle()}>
          {t("research.common.confirm")}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
          {t("research.common.close")}
        </Button>
      </div>
    </div>
  );
});
