/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { DueDateOutline } from "@makeplane/propel/icons";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
// types
import type { TIssue } from "@plane/types";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetDueDateColumn = observer(function SpreadsheetDueDateColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  // store hooks
  const { getStateById } = useProjectState();
  const { data: userProfile } = useUserProfile();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const stateDetails = getStateById(issue.state_id);

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <DateSelect
        value={getDate(issue.target_date) ?? null}
        minDate={getDate(issue.start_date)}
        onChange={(data) => {
          const targetDate = data ? renderFormattedPayloadDate(data) : null;
          onChange(
            issue,
            { target_date: targetDate },
            {
              changed_property: "target_date",
              change_details: targetDate,
            }
          );
        }}
        disabled={disabled}
        placeholder={t("common.order_by.due_date")}
        icon={<DueDateOutline />}
        clearable
        // `.clickable` is what the table's keyboard navigation clicks on Enter / Space in a focused cell.
        className={cn("clickable h-full", {
          "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
        })}
        weekStartsOn={userProfile?.start_of_the_week}
        onClose={onClose}
        variant="table-cell"
      />
    </div>
  );
});
