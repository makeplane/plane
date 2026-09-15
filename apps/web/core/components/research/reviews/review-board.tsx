/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ASSIGNMENT_KIND_LABELS, REVIEW_RECOMMENDATION_LABELS } from "@plane/constants";
import type { TStageReview, TStageReviewerAssignment } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { RequiredReviewerBadge } from "@/components/research/reviews/required-reviewer-badge";
import { ReviewRevisionHistory } from "@/components/research/reviews/review-revision-history";

type Props = {
  workspaceSlug: string;
  assignments: TStageReviewerAssignment[];
  reviews: TStageReview[];
  canManage: boolean;
  onRemind?: (assignmentId: string) => void;
  onRemove?: (assignmentId: string) => void;
  myReview?: TStageReview | null;
  currentUserId?: string;
};

/**
 * Reviewer board: who must review, who already did, and the opinions with
 * their revision history (P1-UI-03).
 */
export const ReviewBoard = observer(function ReviewBoard({
  workspaceSlug,
  assignments,
  reviews,
  canManage,
  onRemind,
  onRemove,
  myReview,
  currentUserId,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-13 font-medium text-primary">{t("research.reviews.reviewers_title")}</h3>
      <div className="flex flex-col gap-1">
        {assignments.map((assignment) => {
          const review = reviews.find((item) => item.reviewer === assignment.reviewer);
          return (
            <div
              key={assignment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-subtle px-2 py-1.5"
            >
              <span className="flex items-center gap-2 text-12 text-primary">
                {assignment.reviewer_detail?.display_name ?? assignment.reviewer}
                <RequiredReviewerBadge
                  role={assignment.reviewer_role}
                  isRequired={assignment.is_required}
                  reviewed={Boolean(review)}
                />
                {assignment.assignment_kind !== "AUTO" && (
                  <span className="text-11 text-tertiary">{t(ASSIGNMENT_KIND_LABELS[assignment.assignment_kind])}</span>
                )}
              </span>
              <span className="flex items-center gap-2">
                {review && (
                  <span className="text-12 text-secondary">
                    {t(REVIEW_RECOMMENDATION_LABELS[review.recommendation])}
                  </span>
                )}
                {canManage && !review && onRemind && (
                  <button
                    type="button"
                    className="rounded border border-subtle px-2 py-0.5 text-11 text-secondary hover:bg-surface-2"
                    onClick={() => onRemind(assignment.id)}
                  >
                    {t("research.reviews.remind")}
                  </button>
                )}
                {canManage && !review && onRemove && (
                  <button
                    type="button"
                    className="rounded border border-subtle px-2 py-0.5 text-11 text-secondary hover:bg-surface-2"
                    onClick={() => onRemove(assignment.id)}
                  >
                    {t("research.reviews.remove")}
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <h3 className="text-13 font-medium text-primary">{t("research.reviews.opinions_title")}</h3>
      <div className="flex flex-col gap-1">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-1 rounded border border-subtle px-2 py-1.5 text-12">
            <div className="flex items-center justify-between gap-2">
              <span className="text-primary">
                {review.reviewer_detail?.display_name ?? review.reviewer}
                {` · ${t(REVIEW_RECOMMENDATION_LABELS[review.recommendation])}`}
                {review.score !== null && review.score !== undefined && ` · ${review.score}`}
              </span>
              <span className="text-11 text-tertiary">
                {review.submitted_at ? new Date(review.submitted_at).toLocaleString() : ""}
              </span>
            </div>
            {review.comment && <span className="text-tertiary">{review.comment}</span>}
            {review.revision_no > 1 && <ReviewRevisionHistory workspaceSlug={workspaceSlug} reviewId={review.id} />}
            {myReview && myReview.id === review.id && currentUserId === review.reviewer && (
              <span className="text-11 text-tertiary">{t("research.reviews.own_review_hint")}</span>
            )}
          </div>
        ))}
        {!reviews.length && <p className="text-12 text-tertiary">{t("research.reviews.no_reviews")}</p>}
      </div>
    </div>
  );
});
