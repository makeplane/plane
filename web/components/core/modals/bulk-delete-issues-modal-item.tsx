import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
// hooks
import { useProjectState } from "hooks/store";

export const BulkDeleteIssuesModalItem: React.FC<any> = observer((props) => {
  const { issue, delete_issue_ids, identifier } = props;
  const { getStateById } = useProjectState();

  const color = getStateById(issue.state_id)?.color;

  return (
    <Combobox.Option
      key={issue.id}
      as="div"
      value={issue.id}
      className={({ active }) =>
        `flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 ${
          active ? "bg-custom-background-80 text-custom-text-100" : ""
        }`
      }
    >
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={delete_issue_ids} readOnly />
        <span
          className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />
        <span className="flex-shrink-0 text-xs">
          {identifier}-{issue.sequence_id}
        </span>
        <span>{issue.name}</span>
      </div>
    </Combobox.Option>
  );
});
