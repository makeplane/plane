import { observer } from "mobx-react-lite";
// components
import { MembersSelect } from "components/project";
// types
import { IUserLite } from "types";

export interface IIssuePropertyAssignee {
  value: string[];
  onChange: (data: string[]) => void;
  members: IUserLite[] | null;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
}

export const IssuePropertyAssignee: React.FC<IIssuePropertyAssignee> = observer((props) => {
  const { value, onChange, members, disabled = false, hideDropdownArrow = false } = props;

  return (
    <MembersSelect
      value={value}
      onChange={onChange}
      members={members ?? undefined}
      disabled={disabled}
      hideDropdownArrow={hideDropdownArrow}
      multiple
    />
  );
});
