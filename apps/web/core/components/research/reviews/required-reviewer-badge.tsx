/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { REVIEWER_ROLE_LABELS } from "@plane/constants";
import type { TReviewerRole } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  role: TReviewerRole;
  isRequired: boolean;
  reviewed?: boolean;
};

/** Role chip that makes the mandatory reviewers obvious (P1-UI-03). */
export const RequiredReviewerBadge = observer(function RequiredReviewerBadge({ role, isRequired, reviewed }: Props) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-1 text-11">
      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-secondary">{t(REVIEWER_ROLE_LABELS[role])}</span>
      {isRequired && (
        <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-accent-primary">
          {t("research.reviews.required")}
        </span>
      )}
      {reviewed && (
        <span className="rounded bg-success-subtle px-1.5 py-0.5 text-success-primary">
          {t("research.reviews.submitted")}
        </span>
      )}
    </span>
  );
});
