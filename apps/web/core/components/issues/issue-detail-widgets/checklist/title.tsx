/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { LinearProgress } from "@makeplane/propel/components/linear-progress";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { getProgress } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issueId: string;
  issueServiceType?: TIssueServiceType;
};

export const ChecklistCollapsibleTitle = observer(function ChecklistCollapsibleTitle(props: Props) {
  const { issueId, issueServiceType = EIssueServiceType.ISSUES } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    checklist: { getChecklistProgressByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const { done, skipped, total, activeTotal } = getChecklistProgressByIssueId(issueId);

  // Every item skipped: activeTotal is 0, so getProgress would read 0% —
  // wrong signal when nothing is actually outstanding (spec FR-014).
  const isAllSkipped = total > 0 && activeTotal === 0;
  const percentage = isAllSkipped ? 100 : getProgress(done, activeTotal);

  return (
    <span className="inline-flex items-center gap-2">
      {t("common.checklist")}
      <span className="flex items-center gap-1.5 text-13 text-tertiary">
        <span className="inline-block w-16">
          <LinearProgress
            value={percentage}
            size="sm"
            variant={percentage === 100 ? "success" : "brand"}
            showValue={false}
            aria-label="Checklist progress"
          />
        </span>
        <span>
          {isAllSkipped ? (
            t("checklist.all_skipped")
          ) : (
            <>
              {done}/{activeTotal} {t("common.done")}
            </>
          )}
        </span>
        {/* Skipped items leave the denominator (spec FR-012, FR-013) — make
            that visible rather than mysterious (spec FR-015). */}
        {!isAllSkipped && skipped > 0 && (
          <span>
            &middot; {skipped} {t("checklist.skipped_suffix")}
          </span>
        )}
      </span>
    </span>
  );
});
