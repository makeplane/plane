import { observer } from "mobx-react";
import { Combobox } from "@headlessui/react";
// hooks
import { ISearchIssueResponse } from "@plane/types";
// plane web hooks
import { IssueIdentifier } from "@/plane-web/components/issues";

interface Props {
  issue: ISearchIssueResponse;
  canDeleteIssueIds: boolean;
}

export const BulkDeleteIssuesModalItem: React.FC<Props> = observer((props: Props) => {
  const { issue, canDeleteIssueIds } = props;

  const color = issue.state__color;

  return (
    <Combobox.Option
      key={issue.id}
      as="div"
      value={issue.id}
      className={({ active }) =>
        `flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 my-0.5 ${
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
        <IssueIdentifier issueId={issue.id} projectId={issue.project_id} textContainerClassName="text-xs" />
        <span>{issue.name}</span>
      </div>
    </Combobox.Option>
  );
});
