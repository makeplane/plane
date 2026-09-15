/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { REVIEW_RECOMMENDATIONS, REVIEW_RECOMMENDATION_LABELS } from "@plane/constants";
import type { TReviewRecommendation, TStageReview } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";

type Props = {
  review?: TStageReview | null;
  onSubmit: (payload: { recommendation: string; comment: string; score: number | null }) => Promise<void>;
  onRevise: (payload: {
    recommendation: string;
    comment: string;
    score: number | null;
    reason: string;
  }) => Promise<void>;
};

/**
 * Review form. After the first submission the same form switches to the
 * "revise with a reason" mode (P1-REV-07): the earlier version stays visible in
 * the revision history.
 */
export const ReviewForm = observer(function ReviewForm({ review, onSubmit, onRevise }: Props) {
  const { t } = useTranslation();
  const [recommendation, setRecommendation] = useState<TReviewRecommendation>("PASS");
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const isRevision = Boolean(review);
  const commentRequired = recommendation !== "PASS";

  const handle = useCallback(async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      const payload = {
        recommendation,
        comment,
        score: score === "" ? null : Number(score),
      };
      if (isRevision) await onRevise({ ...payload, reason });
      else await onSubmit(payload);
      setComment("");
      setReason("");
      setScore("");
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setBusy(false);
    }
  }, [comment, isRevision, onRevise, onSubmit, reason, recommendation, score]);

  return (
    <div className="flex flex-col gap-2 rounded border border-subtle p-2">
      <div className="flex flex-wrap items-center gap-2">
        {REVIEW_RECOMMENDATIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRecommendation(value)}
            className={`rounded px-2 py-1 text-12 ${
              recommendation === value ? "bg-accent-subtle text-accent-primary" : "bg-surface-2 text-secondary"
            }`}
          >
            {t(REVIEW_RECOMMENDATION_LABELS[value])}
          </button>
        ))}
        <Input
          className="!w-24"
          value={score}
          placeholder={t("research.reviews.score_placeholder")}
          onChange={(event) => setScore(event.target.value)}
        />
      </div>
      <textarea
        className="min-h-16 w-full rounded border border-subtle bg-surface-1 p-2 text-12 text-primary"
        value={comment}
        placeholder={t(commentRequired ? "research.reviews.comment_required" : "research.reviews.comment_placeholder")}
        onChange={(event) => setComment(event.target.value)}
      />
      {isRevision && (
        <Input
          value={reason}
          placeholder={t("research.reviews.revision_reason")}
          onChange={(event) => setReason(event.target.value)}
        />
      )}
      {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={busy || (commentRequired && !comment.trim()) || (isRevision && !reason.trim())}
          onClick={() => void handle()}
        >
          {t(isRevision ? "research.reviews.revise" : "research.reviews.submit")}
        </Button>
      </div>
    </div>
  );
});
