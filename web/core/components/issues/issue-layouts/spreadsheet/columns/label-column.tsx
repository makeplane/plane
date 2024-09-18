import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";
// hooks
import { useLabel } from "@/hooks/store";
// components
import { IssuePropertyLabels } from "../../properties";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetLabelColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose } = props;
  // hooks
  const { labelMap } = useLabel();

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200 w-full">
      <IssuePropertyLabels
        projectId={issue.project_id ?? null}
        value={issue.label_ids}
        defaultOptions={defaultLabelOptions}
        onChange={(data) => onChange(issue, { label_ids: data }, { changed_property: "labels", change_details: data })}
        className="h-full w-full "
        buttonClassName="px-page-x w-full h-full group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10 rounded-none"
        hideDropdownArrow
        maxRender={1}
        disabled={disabled}
        placeholderText="Select labels"
        onClose={onClose}
        noLabelBorder
        fullWidth
      />
    </div>
  );
});
