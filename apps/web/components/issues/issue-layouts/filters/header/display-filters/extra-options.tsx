/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { MenuCheckboxItem } from "@makeplane/propel/components/menu";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions, TIssueExtraOptions } from "@plane/types";

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
];

type Props = {
  selectedExtraOptions: {
    sub_issue: boolean;
    show_empty_groups: boolean;
  };
  handleUpdate: (key: keyof IIssueDisplayFilterOptions, val: boolean) => void;
  enabledExtraOptions: TIssueExtraOptions[];
};

export const FilterExtraOptions = observer(function FilterExtraOptions(props: Props) {
  const { selectedExtraOptions, handleUpdate, enabledExtraOptions } = props;
  // hooks
  const { t } = useTranslation();
  const isExtraOptionEnabled = (option: TIssueExtraOptions) => enabledExtraOptions.includes(option);

  return (
    <>
      {ISSUE_EXTRA_OPTIONS.map((option) => {
        if (!isExtraOptionEnabled(option.key)) return null;

        return (
          <MenuCheckboxItem
            key={option.key}
            label={t(option.titleTranslationKey)}
            checked={!!selectedExtraOptions?.[option.key]}
            onCheckedChange={(checked) => handleUpdate(option.key, checked)}
          />
        );
      })}
    </>
  );
});
