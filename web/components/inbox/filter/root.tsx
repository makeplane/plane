import { FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { Search, X } from "lucide-react";
// hooks
import { FilterStatus } from "./status";
// components
import { FilterAssignees, FilterCreatedBy, FilterLabels, FilterPriority } from "components/issues";
import { FilterCreatedDate } from "./created-at";
import { FilterUpdatedDate } from "./updated-at";
// types
import { IIssueLabel, TInboxIssueFilterOptions, TInboxIssueStatus } from "@plane/types";

type TInboxIssueFilterSelection = {
  inboxFilters: Partial<TInboxIssueFilterOptions>;
  handleFiltersUpdate: (key: keyof TInboxIssueFilterOptions, value: number | string | string[]) => void;
  memberIds: string[] | null;
  labels: IIssueLabel[] | undefined;
};

export const InboxIssueFilterSelection: FC<TInboxIssueFilterSelection> = observer((props) => {
  const { inboxFilters, handleFiltersUpdate, memberIds, labels } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // store

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
        {/* Inbox issue status */}
        <div className="py-2">
          <FilterStatus
            appliedFilters={(inboxFilters.inbox_status as TInboxIssueStatus[]) ?? null}
            handleUpdate={(val) => handleFiltersUpdate("inbox_status", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* Priority */}
        <div className="py-2">
          <FilterPriority
            appliedFilters={inboxFilters.priority ?? null}
            handleUpdate={(val) => handleFiltersUpdate("priority", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* Priority */}
        <div className="py-2">
          <FilterAssignees
            appliedFilters={inboxFilters.assignee ?? null}
            handleUpdate={(val) => handleFiltersUpdate("assignee", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds ?? []}
          />
        </div>
        {/* Created By */}
        <div className="py-2">
          <FilterCreatedBy
            appliedFilters={inboxFilters.created_by ?? null}
            handleUpdate={(val) => handleFiltersUpdate("created_by", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds ?? []}
          />
        </div>
        {/* Labels */}
        <div className="py-2">
          <FilterLabels
            appliedFilters={inboxFilters.label ?? null}
            handleUpdate={(val) => handleFiltersUpdate("label", val)}
            searchQuery={filtersSearchQuery}
            labels={labels ?? []}
          />
        </div>
        {/* Created at */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={inboxFilters.created_at ?? null}
            handleUpdate={(val) => handleFiltersUpdate("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* Updated at */}
        <div className="py-2">
          <FilterUpdatedDate
            appliedFilters={inboxFilters.updated_at ?? null}
            handleUpdate={(val) => handleFiltersUpdate("updated_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
