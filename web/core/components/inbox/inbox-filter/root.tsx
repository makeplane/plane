import { FC } from "react";
import { ListFilter } from "lucide-react";
// components
import { InboxIssueFilterSelection, InboxIssueOrderByDropdown } from "@/components/inbox/inbox-filter";
import { FiltersDropdown } from "@/components/issues";

export const FiltersRoot: FC = () => (
  <div className="relative flex items-center gap-2">
    <div>
      <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
        <InboxIssueFilterSelection />
      </FiltersDropdown>
    </div>
    <div>
      <InboxIssueOrderByDropdown />
    </div>
  </div>
);
