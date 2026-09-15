/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { LITERATURE_STATUSES, LITERATURE_STATUS_LABELS } from "@plane/constants";
import type { TLiteratureStatus } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
import type { TLiteratureCreatePayload } from "@/services/research/literature.service";

type Props = {
  onCreate: (payload: TLiteratureCreatePayload) => Promise<void>;
};

/** Quick registration form; the entry is created in the chosen status. */
export const LiteratureForm = observer(function LiteratureForm({ onCreate }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [doi, setDoi] = useState("");
  const [venue, setVenue] = useState("");
  const [year, setYear] = useState("");
  const [summary, setSummary] = useState("");
  const [gapNotes, setGapNotes] = useState("");
  const [status, setStatus] = useState<TLiteratureStatus>("COLLECTED");
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handle = useCallback(async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      await onCreate({
        title: title.trim(),
        doi: doi.trim(),
        venue: venue.trim(),
        year: year ? Number(year) : null,
        summary,
        gap_notes: gapNotes,
        status,
      });
      setTitle("");
      setDoi("");
      setVenue("");
      setYear("");
      setSummary("");
      setGapNotes("");
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [doi, gapNotes, onCreate, status, summary, title, venue, year]);

  return (
    <div className="flex flex-col gap-2 rounded border border-subtle p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="!w-64"
          value={title}
          placeholder={t("research.literature.title_placeholder")}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          className="!w-48"
          value={doi}
          placeholder={t("research.literature.doi_placeholder")}
          onChange={(event) => setDoi(event.target.value)}
        />
        <Input
          className="!w-40"
          value={venue}
          placeholder={t("research.literature.venue_placeholder")}
          onChange={(event) => setVenue(event.target.value)}
        />
        <Input
          className="!w-20"
          value={year}
          placeholder={t("research.literature.year_placeholder")}
          onChange={(event) => setYear(event.target.value)}
        />
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
          value={status}
          onChange={(event) => setStatus(event.target.value as TLiteratureStatus)}
        >
          {LITERATURE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(LITERATURE_STATUS_LABELS[value])}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <textarea
          className="min-h-12 flex-1 rounded border border-subtle bg-surface-1 p-2 text-12 text-primary"
          value={summary}
          placeholder={t("research.literature.summary_placeholder")}
          onChange={(event) => setSummary(event.target.value)}
        />
        <textarea
          className="min-h-12 flex-1 rounded border border-subtle bg-surface-1 p-2 text-12 text-primary"
          value={gapNotes}
          placeholder={t("research.literature.gap_placeholder")}
          onChange={(event) => setGapNotes(event.target.value)}
        />
      </div>
      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}
      <div>
        <Button size="sm" variant="primary" disabled={busy || !title.trim()} onClick={() => void handle()}>
          {t("research.literature.create")}
        </Button>
      </div>
    </div>
  );
});
