import React from "react";
import { observer } from "mobx-react";
import { IIssueDisplayFilterOptions, TIssueExtraOptions } from "@plane/types";

// components
import { FilterOption } from "@/components/issues";
// types
import { ISSUE_EXTRA_OPTIONS } from "@/constants/issue";
// constants

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
            title={option.title}
          />
        );
      })}
    </div>
  );
});
