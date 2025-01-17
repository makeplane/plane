import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TIssueGroupingFilters } from "@plane/types";

// components
import { FilterHeader, FilterOption } from "@/components/issues";
// types
import { ISSUE_FILTER_OPTIONS } from "@/constants/issue";
// constants

type Props = {
  selectedIssueType: TIssueGroupingFilters | undefined;
  handleUpdate: (val: TIssueGroupingFilters) => void;
  isEpic?: boolean;
};

export const FilterIssueGrouping: React.FC<Props> = observer((props) => {
  const { selectedIssueType, handleUpdate, isEpic = false } = props;
  // i18n
  const { t } = useTranslation();

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const activeIssueType = selectedIssueType ?? null;

  return (
    <>
      <FilterHeader
        title={`${isEpic ? t("epic") : t("issue")} ${t("grouping")}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_FILTER_OPTIONS.map((issueType) => (
            <FilterOption
              key={issueType?.key}
              isChecked={activeIssueType === issueType?.key ? true : false}
              onClick={() => handleUpdate(issueType?.key)}
              title={`${t(issueType?.titleTranslationKey)} ${isEpic ? t("epics") : t("issues")}`}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
