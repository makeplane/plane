/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TCodeSummary } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  summary?: TCodeSummary;
};

/** Code activity summary reused by the review page (P1-CODE-06). */
export const CodeSummaryCard = observer(function CodeSummaryCard({ summary }: Props) {
  const { t } = useTranslation();
  if (!summary) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded border border-subtle px-3 py-2 text-12">
      <span className="text-secondary">
        {t("research.code.summary_repositories", { count: summary.repository_count })}
      </span>
      <span className="text-secondary">{t("research.code.summary_artifacts", { count: summary.artifact_count })}</span>
      <span className="text-secondary">{t("research.code.summary_snapshots", { count: summary.snapshot_count })}</span>
      <span className="text-secondary">
        {t("research.code.summary_linked", { count: summary.linked_experiment_count })}
      </span>
      {summary.sync_failed_count > 0 && (
        <span className="text-danger-primary">
          {t("research.code.summary_sync_failed", { count: summary.sync_failed_count })}
        </span>
      )}
      {summary.last_commit.ref_value && (
        <span className="text-tertiary">
          {t("research.code.summary_last_commit", {
            ref: summary.last_commit.ref_value,
          })}
        </span>
      )}
    </div>
  );
});
