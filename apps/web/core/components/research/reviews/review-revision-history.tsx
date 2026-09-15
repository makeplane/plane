/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { REVIEW_RECOMMENDATION_LABELS } from "@plane/constants";
import type { TStageReviewRevision } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  reviewId: string;
};

/** Every revision of a review, with its mandatory reason (P1-REV-07). */
export const ReviewRevisionHistory = observer(function ReviewRevisionHistory({ workspaceSlug, reviewId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const revisions: TStageReviewRevision[] = research.reviewRevisions[reviewId] ?? [];
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    await research.fetchReviewRevisions(workspaceSlug, reviewId);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) return null;

  return (
    <div className="flex flex-col gap-1">
      {revisions.map((revision) => (
        <div key={revision.id} className="flex flex-col gap-0.5 rounded border border-subtle px-2 py-1 text-11">
          <span className="text-secondary">
            {`v${revision.revision_no} · ${t(
              REVIEW_RECOMMENDATION_LABELS[revision.recommendation] ?? revision.recommendation
            )}`}
          </span>
          {revision.comment && <span className="text-tertiary">{revision.comment}</span>}
          {revision.reason && (
            <span className="text-tertiary">{`${t("research.reviews.reason")}: ${revision.reason}`}</span>
          )}
        </div>
      ))}
    </div>
  );
});
