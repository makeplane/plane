import { observer } from "mobx-react-lite";
// components
import { StateSelect } from "components/states";
// types
import { IState } from "types";

export interface IIssuePropertyState {
  value: IState;
  onChange: (state: IState) => void;
  states: IState[] | null;
  disabled?: boolean;
  hideDropdownArrow?: boolean;
}

export const IssuePropertyState: React.FC<IIssuePropertyState> = observer((props) => {
  const { value, onChange, states, disabled, hideDropdownArrow = false } = props;

  return (
    <StateSelect
      value={value}
      onChange={onChange}
      states={states ?? undefined}
      buttonClassName="h-5"
      disabled={disabled}
      hideDropdownArrow={hideDropdownArrow}
    />
  );
});
