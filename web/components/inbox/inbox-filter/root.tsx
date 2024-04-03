import { FC } from "react";
import { ListFilter } from "lucide-react";
// components
import { InboxIssueFilterSelection } from "@/components/inbox/inbox-filter";
import { FiltersDropdown } from "@/components/issues";

export const FiltersRoot: FC = () => (
  <div className="relative flex items-center gap-2">
    <div>
      <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
        <InboxIssueFilterSelection />
      </FiltersDropdown>
    </div>
    <div>
      Sorting
      {/* <InboxIssueOrderByDropdown
              value={displayFilters?.order_by}
              onChange={(val) => {
                if (!projectId || val === displayFilters?.order_by) return;
                updateDisplayFilters(workspaceSlug, projectId, {
                  order_by: val,
                });
              }}
            /> */}
    </div>
  </div>
);
