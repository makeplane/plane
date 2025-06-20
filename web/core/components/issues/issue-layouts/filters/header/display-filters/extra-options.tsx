import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { IIssueDisplayFilterOptions, TIssueExtraOptions } from "@plane/types";
// components
import { FilterOption } from "@/components/issues";

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

export const FilterExtraOptions: React.FC<Props> = observer((props) => {
  const { selectedExtraOptions, handleUpdate, enabledExtraOptions } = props;
  // hooks
  const { t } = useTranslation();
  const isExtraOptionEnabled = (option: TIssueExtraOptions) => enabledExtraOptions.includes(option);

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
