import { FC, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { TInboxIssueFilter } from "@plane/types";
// components
import {
  FilterStatus,
  FilterPriority,
  FilterMember,
  FilterDate,
  FilterLabels,
  FilterState,
} from "@/components/inbox/inbox-filter/filters";
// constants
import { INBOX_FILTERS_APPLIED, INBOX_FILTERS_REMOVED } from "@/constants/event-tracker";
import { INBOX_STATUS } from "@/constants/inbox";
// hooks
import { useMember, useLabel, useProjectState, useProjectInbox, useEventTracker } from "@/hooks/store";

export const InboxIssueFilterSelection: FC = observer(() => {
  // hooks
  const {
    project: { projectMemberIds },
  } = useMember();
  const { projectLabels } = useLabel();
  const { projectStates } = useProjectState();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { captureEvent } = useEventTracker();
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const handleFilterUpdate = useCallback(
    (
      filterKey: keyof TInboxIssueFilter,
      filterValue: TInboxIssueFilter[keyof TInboxIssueFilter],
      isSelected: boolean,
      interactedValue: string
    ) => {
      captureEvent(isSelected ? INBOX_FILTERS_REMOVED : INBOX_FILTERS_APPLIED, {
        filter_type: filterKey,
        filter_property: interactedValue,
        current_filters: {
          ...inboxFilters,
          status: inboxFilters?.status?.map((status) => INBOX_STATUS.find((s) => s.status === status)?.title),
        },
      });
      handleInboxIssueFilters(filterKey, filterValue);
    },
    [captureEvent, inboxFilters, handleInboxIssueFilters]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-custom-background-100 p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 py-1 text-xs">
          <Search className="text-custom-text-400" size={12} strokeWidth={2} />
          <input
            type="text"
            className="w-full bg-custom-background-90 outline-none placeholder:text-custom-text-400"
            placeholder="Search"
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
            autoFocus
          />
          {filtersSearchQuery !== "" && (
            <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
              <X className="text-custom-text-300" size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
        {/* status */}
        <div className="py-2">
          <FilterStatus
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* state */}
        <div className="py-2">
          <FilterState
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            states={projectStates}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* Priority */}
        <div className="py-2">
          <FilterPriority
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* assignees */}
        <div className="py-2">
          <FilterMember
            filterKey="assignees"
            label="Assignees"
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            searchQuery={filtersSearchQuery}
            memberIds={projectMemberIds ?? []}
          />
        </div>
        {/* Created By */}
        <div className="py-2">
          <FilterMember
            filterKey="created_by"
            label="Created By"
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            searchQuery={filtersSearchQuery}
            memberIds={projectMemberIds ?? []}
          />
        </div>
        {/* Labels */}
        <div className="py-2">
          <FilterLabels
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            searchQuery={filtersSearchQuery}
            labels={projectLabels ?? []}
          />
        </div>
        {/* Created at */}
        <div className="py-2">
          <FilterDate
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            filterKey="created_at"
            label="Created date"
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* Updated at */}
        <div className="py-2">
          <FilterDate
            inboxFilters={inboxFilters}
            handleFilterUpdate={handleFilterUpdate}
            filterKey="updated_at"
            label="Last updated date"
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
