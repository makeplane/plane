import { observer } from "mobx-react-lite";
// components
import { LabelSelect } from "components/labels";
// types
import { IIssueLabels } from "types";

export interface IIssuePropertyLabels {
  value: string[];
  onChange: (data: string[]) => void;
  labels: IIssueLabels[] | null;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
}

export const IssuePropertyLabels: React.FC<IIssuePropertyLabels> = observer((props) => {
  const { value, onChange, labels, disabled, hideDropdownArrow = false } = props;

  return (
    <LabelSelect
      value={value}
      onChange={onChange}
      labels={labels ?? undefined}
      buttonClassName="h-5"
      disabled={disabled}
      hideDropdownArrow={hideDropdownArrow}
    />
  );
});
