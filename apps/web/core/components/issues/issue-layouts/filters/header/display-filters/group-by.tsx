import React, { useState } from "react";
import { observer } from "mobx-react";
import { ISSUE_GROUP_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IIssueDisplayFilterOptions, TIssueGroupByOptions } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";

type Props = {
  displayFilters: IIssueDisplayFilterOptions | undefined;
  groupByOptions: TIssueGroupByOptions[];
  handleUpdate: (val: TIssueGroupByOptions) => void;
  ignoreGroupedFilters: Partial<TIssueGroupByOptions>[];
};

export const FilterGroupBy: React.FC<Props> = observer((props) => {
  const { displayFilters, groupByOptions, handleUpdate, ignoreGroupedFilters } = props;
  // hooks
  const { t } = useTranslation();
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const selectedGroupBy = displayFilters?.group_by ?? null;
  const selectedSubGroupBy = displayFilters?.sub_group_by ?? null;

  return (
    <>
      <FilterHeader
        title={t("common.group_by")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_GROUP_BY_OPTIONS.filter((option) => groupByOptions.includes(option.key)).map((groupBy) => {
            if (
              displayFilters?.layout === "kanban" &&
              selectedSubGroupBy !== null &&
              groupBy.key === selectedSubGroupBy
            )
              return null;
            if (ignoreGroupedFilters.includes(groupBy?.key)) return null;

            return (
              <FilterOption
                key={groupBy?.key}
                isChecked={selectedGroupBy === groupBy?.key ? true : false}
                onClick={() => handleUpdate(groupBy.key)}
                title={t(groupBy.titleTranslationKey)}
                multiple={false}
              />
            );
          })}
        </div>
      )}
    </>
  );
});
