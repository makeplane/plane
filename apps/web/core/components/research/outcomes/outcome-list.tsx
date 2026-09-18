/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { OUTCOME_STATUSES, OUTCOME_STATUS_LABELS, OUTCOME_TYPES, OUTCOME_TYPE_LABELS } from "@plane/constants";
import type { TOutcomeStatus, TOutcomeType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const STATUS_TONES: Record<TOutcomeStatus, string> = {
  DRAFT: "bg-surface-2 text-tertiary",
  SUBMITTED: "bg-accent-subtle text-accent-primary",
  ACCEPTED: "bg-success-subtle text-success-primary",
  PUBLISHED: "bg-success-subtle text-success-primary",
};

/** Outcomes page: register results and link them back into the chain (P1-FIN-02). */
export const OutcomeList = observer(function OutcomeList({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const outcomes = research.getOutcomes(workspaceSlug, projectId);
  const [title, setTitle] = useState("");
  const [outputType, setOutputType] = useState<TOutcomeType>("PAPER");
  const [venue, setVenue] = useState("");
  const [doi, setDoi] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    void research.fetchOutcomes(workspaceSlug, projectId).catch((error) => setErrorKey(getResearchErrorKey(error)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="!w-64"
          value={title}
          placeholder={t("research.outcomes.title_placeholder")}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          className="!w-44"
          value={venue}
          placeholder={t("research.outcomes.venue_placeholder")}
          onChange={(event) => setVenue(event.target.value)}
        />
        <Input
          className="!w-40"
          value={doi}
          placeholder={t("research.outcomes.doi_placeholder")}
          onChange={(event) => setDoi(event.target.value)}
        />
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
          value={outputType}
          onChange={(event) => setOutputType(event.target.value as TOutcomeType)}
        >
          {OUTCOME_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(OUTCOME_TYPE_LABELS[value])}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="primary"
          disabled={!title.trim()}
          onClick={async () => {
            try {
              await research.createOutcome(workspaceSlug, projectId, {
                title: title.trim(),
                output_type: outputType,
                venue: venue.trim(),
                doi: doi.trim(),
              });
              setTitle("");
              setVenue("");
              setDoi("");
            } catch (error) {
              setErrorKey(getResearchErrorKey(error));
            }
          }}
        >
          {t("research.outcomes.register")}
        </Button>
        <a
          className="ml-auto text-12 text-accent-primary hover:underline"
          href={research.chainExportUrl(workspaceSlug, projectId)}
          target="_blank"
          rel="noreferrer"
        >
          {t("research.outcomes.export_chain")}
        </a>
      </div>

      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.outcomes.columns.title")}</th>
            <th className="font-normal py-2">{t("research.outcomes.columns.type")}</th>
            <th className="font-normal py-2">{t("research.outcomes.columns.venue")}</th>
            <th className="font-normal py-2">{t("research.outcomes.columns.status")}</th>
            <th className="font-normal py-2">{t("research.outcomes.columns.links")}</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((outcome) => (
            <tr key={outcome.id} className="border-b border-subtle/60">
              <td className="py-2 text-secondary">{outcome.title}</td>
              <td className="py-2 text-tertiary">{t(OUTCOME_TYPE_LABELS[outcome.output_type])}</td>
              <td className="py-2 text-tertiary">{outcome.venue || outcome.doi || "-"}</td>
              <td className="py-2">
                <select
                  className="rounded border border-subtle bg-surface-1 px-1 py-0.5 text-11 text-secondary"
                  value={outcome.status}
                  onChange={(event) =>
                    void research
                      .updateOutcome(workspaceSlug, outcome.id, { status: event.target.value })
                      .catch(() => undefined)
                  }
                >
                  {OUTCOME_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t(OUTCOME_STATUS_LABELS[value])}
                    </option>
                  ))}
                </select>
                <span className={`ml-2 rounded px-1.5 py-0.5 text-11 ${STATUS_TONES[outcome.status]}`}>
                  {t(OUTCOME_STATUS_LABELS[outcome.status])}
                </span>
              </td>
              <td className="py-2 text-tertiary">{outcome.links?.length ?? 0}</td>
            </tr>
          ))}
          {!outcomes.length && (
            <tr>
              <td colSpan={5} className="py-3 text-tertiary">
                {t("research.outcomes.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-11 text-tertiary">{t("research.outcomes.link_hint")}</p>
    </div>
  );
});
