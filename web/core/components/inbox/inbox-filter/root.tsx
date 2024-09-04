import { FC } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
// components
import { cn } from "@plane/editor";
import { getButtonStyling } from "@plane/ui";
import { InboxIssueFilterSelection, InboxIssueOrderByDropdown } from "@/components/inbox/inbox-filter";
import { FiltersDropdown } from "@/components/issues";

const smallButton = <ListFilter className="h-3 " />;
const largeButton = (
  <div className={cn(getButtonStyling("neutral-primary", "sm"), "text-custom-text-300")}>
    <ListFilter className="h-3 " />
    <span className="hidden lg:flex">Filters</span>

    <ChevronDown className="h-3 w-3" strokeWidth={2} />
  </div>
);
export const FiltersRoot: FC = () => (
  <div className="relative flex items-center gap-2">
    <div>
      <FiltersDropdown
        menuButton={
          <>
            <div className="hidden 2xl:flex">{largeButton}</div>
            <div className="flex 2xl:hidden">{smallButton}</div>
          </>
        }
        title=""
        placement="bottom-end"
      >
        <InboxIssueFilterSelection />
      </FiltersDropdown>
    </div>
    <div>
      <InboxIssueOrderByDropdown />
    </div>
  </div>
);
