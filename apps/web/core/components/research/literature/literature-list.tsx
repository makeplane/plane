/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { LITERATURE_STATUSES, LITERATURE_STATUS_LABELS } from "@plane/constants";
import type { TLiteratureStatus } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";
// components
import { LiteratureForm } from "@/components/research/literature/literature-form";
import { LiteratureImportDialog } from "@/components/research/literature/literature-import-dialog";
import { LiteratureStatusBoard } from "@/components/research/literature/literature-status-board";
import { LiteratureThresholdPanel } from "@/components/research/literature/literature-threshold-panel";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const STATUS_TONES: Record<TLiteratureStatus, string> = {
  COLLECTED: "bg-surface-2 text-tertiary",
  SCREENED: "bg-accent-subtle text-accent-primary",
  INCLUDED: "bg-success-subtle text-success-primary",
  EXCLUDED: "bg-danger-subtle text-danger-primary",
};

/** Literature page: filters, status board, threshold panel and entries (§6.2). */
export const LiteratureList = observer(function LiteratureList({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const entries = research.getLiterature(workspaceSlug, projectId);
  const threshold = research.literatureThreshold[projectId];

  useEffect(() => {
    void research
      .fetchLiterature(workspaceSlug, projectId, { status: status || undefined, q: query || undefined })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, status]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-5">
      <LiteratureThresholdPanel threshold={threshold} />
      <div className="flex flex-wrap items-center gap-2">
        <LiteratureStatusBoard counters={threshold?.counters} active={status} onSelect={(value) => setStatus(value)} />
        <Input
          className="!w-56"
          value={query}
          placeholder={t("research.literature.search_placeholder")}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter")
              void research
                .fetchLiterature(workspaceSlug, projectId, { status: status || undefined, q: query || undefined })
                .catch(() => undefined);
          }}
        />
        <LiteratureImportDialog onImport={(payload) => research.importLiterature(workspaceSlug, projectId, payload)} />
      </div>

      <LiteratureForm
        onCreate={async (payload) => {
          await research.createLiterature(workspaceSlug, projectId, payload);
          await research.fetchLiterature(workspaceSlug, projectId, { status: status || undefined });
        }}
      />

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.literature.columns.title")}</th>
            <th className="font-normal py-2">{t("research.literature.columns.year")}</th>
            <th className="font-normal py-2">{t("research.literature.columns.venue")}</th>
            <th className="font-normal py-2">{t("research.literature.columns.doi")}</th>
            <th className="font-normal py-2">{t("research.literature.columns.status")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-subtle/60">
              <td className="py-2 text-secondary">
                {entry.title}
                {!entry.is_annotated && (
                  <span className="ml-2 text-11 text-warning-primary">{t("research.literature.needs_notes")}</span>
                )}
              </td>
              <td className="py-2 text-tertiary">{entry.year ?? "-"}</td>
              <td className="py-2 text-tertiary">{entry.venue || "-"}</td>
              <td className="py-2 text-tertiary">{entry.doi || "-"}</td>
              <td className="py-2">
                <span className={`rounded px-1.5 py-0.5 text-11 ${STATUS_TONES[entry.status]}`}>
                  {t(LITERATURE_STATUS_LABELS[entry.status])}
                </span>
              </td>
              <td className="py-2 text-right">
                <select
                  className="rounded border border-subtle bg-surface-1 px-1 py-0.5 text-11 text-secondary"
                  value={entry.status}
                  onChange={(event) =>
                    void research
                      .updateLiteratureStatus(workspaceSlug, entry.id, { status: event.target.value })
                      .catch(() => undefined)
                  }
                >
                  {LITERATURE_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(LITERATURE_STATUS_LABELS[value])}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {!entries.length && (
            <tr>
              <td colSpan={6} className="py-3 text-tertiary">
                {t("research.literature.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
