import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
// hooks
import { ISearchIssueResponse } from "@plane/types";

interface Props {
  issue: ISearchIssueResponse;
  canDeleteIssueIds: boolean;
  identifier: string | undefined;
}

export const BulkDeleteIssuesModalItem: React.FC<Props> = observer((props: Props) => {
  const { issue, canDeleteIssueIds, identifier } = props;

  const color = issue.state__color;

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
        <input type="checkbox" checked={canDeleteIssueIds} readOnly />
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
