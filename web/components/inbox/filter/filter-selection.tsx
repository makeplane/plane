import { FC } from "react";
import { observer } from "mobx-react-lite";
// ui
import { PriorityIcon } from "@plane/ui";
// components
import { MultiLevelDropdown } from "components/ui";
// constants
import { INBOX_STATUS } from "constants/inbox";
import { ISSUE_PRIORITIES } from "constants/issue";
// hooks
import { useProjectInbox } from "hooks/store";
// types
// import { TInboxIssueFilterOptions } from "@plane/types";

type TInboxIssueFilterSelection = { workspaceSlug: string; projectId: string };

export const InboxIssueFilterSelection: FC<TInboxIssueFilterSelection> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks'
  const { inboxFilters, inboxIssuesFiltersLength, updateInboxIssuePriorityFilters, updateInboxIssueStatusFilters } =
    useProjectInbox();

  const handleSelect = (option: { key: string; value: string }) => {
    if (!projectId) return;
    if (option.key === "priority") updateInboxIssuePriorityFilters(workspaceSlug, projectId, option.value);
    if (option.key === "inbox_status") updateInboxIssueStatusFilters(workspaceSlug, projectId, parseInt(option.value));
  };

  return (
    <div className="relative">
      <MultiLevelDropdown
        label="Filters"
        onSelect={handleSelect}
        direction="right"
        height="rg"
        options={[
          {
            id: "priority",
            label: "Priority",
            value: ISSUE_PRIORITIES.map((p) => p.key),
            hasChildren: true,
            children: ISSUE_PRIORITIES.map((priority) => ({
              id: priority.key,
              label: (
                <div className="flex items-center gap-2 capitalize">
                  <PriorityIcon priority={priority.key} /> {priority.title ?? "None"}
                </div>
              ),
              value: {
                key: "priority",
                value: priority.key,
              },
              selected: inboxFilters?.priority?.includes(priority.key),
            })),
          },
          {
            id: "inbox_status",
            label: "Status",
            value: INBOX_STATUS.map((status) => status.status),
            hasChildren: true,
            children: INBOX_STATUS.map((status) => ({
              id: status.status.toString(),
              label: (
                <div className="relative inline-flex gap-2 items-center">
                  <div className={status.textColor(false)}>
                    <status.icon size={12} />
                  </div>
                  <div>{status.title}</div>
                </div>
              ),
              value: {
                key: "inbox_status",
                value: status.status,
              },
              selected: inboxFilters?.inbox_status?.includes(status.status),
            })),
          },
        ]}
      />

      {inboxIssuesFiltersLength > 0 && (
        <div className="absolute -right-2 -top-2 z-10 grid h-4 w-4 place-items-center rounded-full border border-custom-border-200 bg-custom-background-80 text-[0.65rem] text-custom-text-100">
          <span>{inboxIssuesFiltersLength}</span>
        </div>
      )}
    </div>
  );
});
