import { PrioritySelect } from "components/project";
import { observer } from "mobx-react-lite";
// types
import { TIssuePriorities } from "types";

export interface IIssuePropertyPriority {
  value: TIssuePriorities;
  onChange: (value: TIssuePriorities) => void;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
}

export const IssuePropertyPriority: React.FC<IIssuePropertyPriority> = observer((props) => {
  const { value, onChange, disabled, hideDropdownArrow = false } = props;

  return (
    <PrioritySelect
      value={value}
      onChange={onChange}
      buttonClassName="!h-5 p-1.5"
      disabled={disabled}
      hideDropdownArrow={hideDropdownArrow}
    />
  );
});
