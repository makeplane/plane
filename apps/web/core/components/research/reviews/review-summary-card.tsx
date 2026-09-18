/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { REVIEW_RECOMMENDATION_LABELS } from "@plane/constants";
import type { TReviewSummary } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  summary?: TReviewSummary;
};

/** Rule explanation with the current decision (P1-UI-03, P1-REV-05). */
export const ReviewSummaryCard = observer(function ReviewSummaryCard({ summary }: Props) {
  const { t } = useTranslation();
  if (!summary) return null;
  const { decision, rules } = summary;
  const detail = decision.detail;

  return (
    <div className="flex flex-col gap-2 rounded border border-subtle p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-13 font-medium text-primary">{t("research.reviews.summary_title")}</h3>
        <span
          className={`rounded px-1.5 py-0.5 text-11 ${
            decision.passed ? "bg-success-subtle text-success-primary" : "bg-danger-subtle text-danger-primary"
          }`}
        >
          {t(decision.passed ? "research.reviews.decision_pass" : "research.reviews.decision_blocked")}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-12 text-secondary">
        <span>
          {t("research.reviews.reviewer_count")}: {detail.review_count} / {rules.min_reviewers}
        </span>
        <span>
          {t("research.reviews.pass_ratio")}: {detail.pass_count}/{detail.review_count || 0}
        </span>
        {Object.entries(detail.distribution).map(([key, value]) => (
          <span key={key}>
            {t(REVIEW_RECOMMENDATION_LABELS[key as keyof typeof REVIEW_RECOMMENDATION_LABELS] ?? key)}: {value}
          </span>
        ))}
      </div>
      {detail.pending_required_roles.length > 0 && (
        <p className="text-12 text-danger-primary">
          {t("research.reviews.pending_roles", { roles: detail.pending_required_roles.join(", ") })}
        </p>
      )}
      {detail.vetoed_by && <p className="text-12 text-danger-primary">{t("research.reviews.vetoed")}</p>}
      <ul className="flex flex-col gap-0.5 text-11 text-tertiary">
        <li>{t("research.reviews.rule_advisor")}</li>
        <li>{t("research.reviews.rule_pi_branch")}</li>
        <li>{t("research.reviews.rule_veto")}</li>
        <li>{t("research.reviews.rule_version", { version: detail.rule_version })}</li>
      </ul>
    </div>
  );
});
