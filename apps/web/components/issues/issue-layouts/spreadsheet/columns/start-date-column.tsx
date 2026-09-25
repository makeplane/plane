/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { StartDateOutline } from "@makeplane/propel/icons";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
// types
import type { TIssue } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetStartDateColumn = observer(function SpreadsheetStartDateColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: userProfile } = useUserProfile();

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <DateSelect
        value={getDate(issue.start_date) ?? null}
        maxDate={getDate(issue.target_date)}
        onChange={(data) => {
          const startDate = data ? renderFormattedPayloadDate(data) : null;
          onChange(
            issue,
            { start_date: startDate },
            {
              changed_property: "start_date",
              change_details: startDate,
            }
          );
        }}
        disabled={disabled}
        placeholder={t("common.order_by.start_date")}
        icon={<StartDateOutline />}
        clearable
        // `.clickable` is what the table's keyboard navigation clicks on Enter / Space in a focused cell.
        className="clickable h-full"
        weekStartsOn={userProfile?.start_of_the_week}
        onClose={onClose}
        variant="table-cell"
      />
    </div>
  );
});
