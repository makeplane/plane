/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { REVIEW_RECOMMENDATION_LABELS, REVIEWER_ROLE_LABELS, STAGE_TYPE_LABELS } from "@plane/constants";
import type { TStageReview, TToMeReview } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
};

type TScope = "to_me" | "mine";

/**
 * "Waiting for me" inbox: required and optional reviews are separated so a
 * mandatory review is never hidden behind optional ones (P1-REV-09, P1-UI-03).
 */
export const ReviewInbox = observer(function ReviewInbox({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [scope, setScope] = useState<TScope>("to_me");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (scope === "to_me") await research.fetchToMeReviews(workspaceSlug);
      else await research.fetchMyReviews(workspaceSlug);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const pending: TToMeReview[] = research.toMeReviews;
  const mine: TStageReview[] = research.myReviews;

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        {(["to_me", "mine"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScope(value)}
            className={`rounded px-2 py-1 text-12 ${
              scope === value ? "bg-surface-2 text-primary" : "text-tertiary hover:bg-surface-2"
            }`}
          >
            {t(`research.reviews.scope_${value}`)}
          </button>
        ))}
      </div>

      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}

      {scope === "to_me" && (
        <div className="flex flex-col gap-2">
          {pending.map((item) => (
            <div
              key={item.assignment_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-subtle px-3 py-2"
            >
              <span className="flex items-center gap-2 text-12 text-primary">
                {t(STAGE_TYPE_LABELS[item.stage])}
                <span className="text-11 text-tertiary">{item.project_name}</span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
                  {t(REVIEWER_ROLE_LABELS[item.reviewer_role])}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-11 ${
                    item.is_required ? "bg-accent-subtle text-accent-primary" : "bg-surface-2 text-tertiary"
                  }`}
                >
                  {t(item.is_required ? "research.reviews.required" : "research.reviews.optional")}
                </span>
              </span>
              <Link
                className="text-12 text-accent-primary hover:underline"
                href={`/${workspaceSlug}/research/projects/${item.project}/stages/${item.stage}`}
              >
                {t("research.reviews.open_stage")}
              </Link>
            </div>
          ))}
          {!pending.length && <p className="text-12 text-tertiary">{t("research.reviews.inbox_empty")}</p>}
        </div>
      )}

      {scope === "mine" && (
        <div className="flex flex-col gap-1">
          {mine.map((review) => (
            <div
              key={review.id}
              className="flex items-center justify-between gap-2 rounded border border-subtle px-3 py-2"
            >
              <span className="text-12 text-primary">
                {t(REVIEW_RECOMMENDATION_LABELS[review.recommendation])}
                {` · v${review.revision_no}`}
              </span>
              <span className="text-11 text-tertiary">
                {review.submitted_at ? new Date(review.submitted_at).toLocaleString() : ""}
              </span>
            </div>
          ))}
          {!mine.length && <p className="text-12 text-tertiary">{t("research.reviews.mine_empty")}</p>}
        </div>
      )}
    </div>
  );
});
