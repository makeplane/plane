/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, TIssueExtraOptions, TIssueGroupByOptions } from "@plane/types";
// components
import { FilterOption } from "@/components/issues/issue-layouts/filters";

// constants
const ISSUE_EXTRA_OPTIONS: {
  key: TIssueExtraOptions;
  titleTranslationKey: string;
}[] = [
  {
    key: "sub_issue",
    titleTranslationKey: "issue.display.extra.show_sub_issues",
  }, // in spreadsheet its always false
  {
    key: "show_empty_groups",
    titleTranslationKey: "issue.display.extra.show_empty_groups",
  }, // filter on front-end
  {
    key: "show_empty_sub_groups",
    titleTranslationKey: "issue.display.extra.show_empty_sub_groups",
  }, // filter on front-end, only when sub_group_by is set
  {
    key: "hide_completed_cycles",
    titleTranslationKey: "issue.display.extra.hide_completed_cycles",
  }, // only shown when group_by is cycle
];

type Props = {
  selectedExtraOptions: {
    sub_issue: boolean;
    show_empty_groups: boolean;
    show_empty_sub_groups?: boolean;
    hide_completed_cycles?: boolean;
  };
  handleUpdate: (key: keyof IIssueDisplayFilterOptions, val: boolean) => void;
  enabledExtraOptions: TIssueExtraOptions[];
  groupBy?: TIssueGroupByOptions;
  subGroupBy?: TIssueGroupByOptions;
};

export const FilterExtraOptions = observer(function FilterExtraOptions(props: Props) {
  const { selectedExtraOptions, handleUpdate, enabledExtraOptions, groupBy, subGroupBy } = props;
  // hooks
  const { t } = useTranslation();
  const isExtraOptionEnabled = (option: TIssueExtraOptions) => {
    // Show hide_completed_cycles only when group_by is cycle
    if (option === "hide_completed_cycles" && groupBy !== "cycle") return false;
    // Show show_empty_sub_groups only when sub_group_by is set
    if (option === "show_empty_sub_groups" && !subGroupBy) return false;
    return enabledExtraOptions.includes(option);
  };

  return (
    <div>
      {ISSUE_EXTRA_OPTIONS.map((option) => {
        if (!isExtraOptionEnabled(option.key)) return null;

        return (
          <FilterOption
            key={option.key}
            isChecked={selectedExtraOptions?.[option.key] ? true : false}
            onClick={() => handleUpdate(option.key, !selectedExtraOptions?.[option.key])}
            title={t(option.titleTranslationKey)}
          />
        );
      })}
    </div>
  );
});
