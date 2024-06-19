import { observer } from "mobx-react";
import { Dropdown } from "@plane/ui";
import { EIssueLayoutTypes, ISSUE_LAYOUT_MAP } from "@/constants/issue";

type TLayoutDropDown = {
  onChange: (value: EIssueLayoutTypes) => void;
  value: EIssueLayoutTypes;
};
export const LayoutDropDown = observer((props: TLayoutDropDown) => {
  const { onChange, value = EIssueLayoutTypes.LIST } = props;

  const options = Object.values(ISSUE_LAYOUT_MAP).map((issueLayout) => ({
    data: issueLayout.key,
    value: issueLayout.key,
  }));

  return (
    <Dropdown
      onChange={onChange as (value: string) => void}
      value={value?.toString()}
      keyExtractor={(option) => option.value}
      options={options}
      disableSearch
    />
  );
});
