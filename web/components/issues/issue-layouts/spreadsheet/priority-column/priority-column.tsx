// components
import { PrioritySelect } from "components/project";
// types
import { IIssue, TIssuePriorities } from "types";

type Props = {
  issue: IIssue;
  onChange: (data: TIssuePriorities) => void;
  disabled: boolean;
};

export const PriorityColumn: React.FC<Props> = (props) => {
  const { issue, onChange, disabled } = props;

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        <PrioritySelect
          value={issue.priority}
          onChange={onChange}
          buttonClassName="!p-0 !rounded-none !shadow-none !border-0"
          hideDropdownArrow
          disabled={disabled}
        />
      </span>
    </div>
  );
};
