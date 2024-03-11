import { FC } from "react";
import { observer } from "mobx-react-lite";
// icons
import { X } from "lucide-react";
// components
import { InboxIssueAppliedPriorityFilters, InboxIssueAppliedStatusFilters } from "components/inbox";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { useProjectInbox } from "hooks/store";

export type InboxIssueAppliedFilterProps = { workspaceSlug: string; projectId: string };

export const InboxIssueAppliedFilter: FC<InboxIssueAppliedFilterProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks
  const {
    inboxFilters,
    inboxIssuesFiltersLength,
    updateInboxIssuePriorityFilter,
    updateInboxIssueStatusFilter,
    resetInboxPriorityFilters,
    resetInboxStatusFilters,
    resetInboxFilters,
  } = useProjectInbox();

  console.log("inboxFilters", inboxFilters);

  if (!inboxFilters || inboxIssuesFiltersLength <= 0) return <></>;

  return (
    <div className="relative flex flex-wrap items-center gap-2 p-3 text-[0.65rem] border-b border-custom-border-100">
      {Object.keys(inboxFilters || {}).map((key) => (
        <div
          key={key}
          className="flex items-center gap-x-2 rounded-full border border-custom-border-200 bg-custom-background-80 px-2 py-1"
        >
          <span className="capitalize text-custom-text-200">{replaceUnderscoreIfSnakeCase(key)}:</span>
          <div className="space-x-2">
            {key === "priority" && (
              <div className="flex flex-wrap items-center gap-1">
                <InboxIssueAppliedPriorityFilters
                  priorities={inboxFilters[key] || []}
                  removeFilter={(priority: string) =>
                    updateInboxIssuePriorityFilter(workspaceSlug, projectId, priority)
                  }
                />
                <button type="button" onClick={() => resetInboxPriorityFilters()}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {key === "inbox_status" && (
              <div className="flex flex-wrap items-center gap-1">
                <InboxIssueAppliedStatusFilters
                  statuses={inboxFilters[key] || []}
                  removeStatus={(status: number) => updateInboxIssueStatusFilter(workspaceSlug, projectId, status)}
                />
                <button type="button" onClick={() => resetInboxStatusFilters}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => resetInboxFilters()}
        className="flex items-center gap-x-1 rounded-full border border-custom-border-200 bg-custom-background-80 px-3 py-1.5 text-custom-text-200 hover:text-custom-text-100"
      >
        <span>Clear all</span>
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});
