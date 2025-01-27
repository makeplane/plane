import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TIssueGroupingFilters } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// constants

type Props = {
  selectedIssueType: TIssueGroupingFilters | undefined;
  handleUpdate: (val: TIssueGroupingFilters) => void;
  isEpic?: boolean;
};

const ISSUE_FILTER_OPTIONS: {
  key: TIssueGroupingFilters;
  i18n_title: string;
}[] = [
  { key: null, i18n_title: "common.all" },
  { key: "active", i18n_title: "issue.states.active" },
  { key: "backlog", i18n_title: "issue.states.backlog" },
  // { key: "draft", title: "Draft Issues" },
];

export const FilterIssueGrouping: React.FC<Props> = observer((props) => {
  const { selectedIssueType, handleUpdate, isEpic = false } = props;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const activeIssueType = selectedIssueType ?? null;

  // hooks
  const { t } = useTranslation();

  return (
    <>
      <FilterHeader
        title={t("entity.grouping_title", {
          entity: isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 }), // Count is used to pluralize the label
        })}
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
              title={`${t(issueType.i18n_title)} ${isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}`}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
