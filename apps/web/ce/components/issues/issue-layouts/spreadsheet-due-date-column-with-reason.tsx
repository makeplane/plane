/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { SpreadsheetDueDateColumn } from "@/components/issues/issue-layouts/spreadsheet/columns";
import { FieldChangeReasonModal } from "@/plane-web/components/issues/issue-details/sidebar/field-change-reason-modal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TUpdates = any;

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: TUpdates) => void;
  disabled: boolean;
};

/** CE wrapper that intercepts due date changes and requires a reason before updating. */
export const SpreadsheetDueDateColumnWithReason = observer(function SpreadsheetDueDateColumnWithReason(props: Props) {
  const { issue, onClose, onChange, disabled } = props;
  const { t } = useTranslation();
  const [pendingChange, setPendingChange] = useState<{ data: Partial<TIssue>; updates: TUpdates } | null>(null);

  const handleChange = (_issue: TIssue, data: Partial<TIssue>, updates: TUpdates) => {
    if (!data.target_date) {
      // Clearing — no reason required
      onChange(issue, data, updates);
      return;
    }
    setPendingChange({ data, updates });
  };

  const handleConfirm = (reason: string): Promise<void> => {
    if (pendingChange) {
      onChange(issue, { ...pendingChange.data, reason } as Partial<TIssue>, pendingChange.updates);
    }
    setPendingChange(null);
    return Promise.resolve();
  };

  return (
    <>
      <SpreadsheetDueDateColumn issue={issue} onChange={handleChange} disabled={disabled} onClose={onClose} />
      <FieldChangeReasonModal
        isOpen={!!pendingChange}
        onClose={() => setPendingChange(null)}
        onConfirm={handleConfirm}
        fieldLabel={t("common.order_by.due_date")}
      />
    </>
  );
});
