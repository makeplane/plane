"use client";

import { observer } from "mobx-react";
// icons
import { ChevronDown, ListFilter } from "lucide-react";
// components
import { Row } from "@plane/ui";
import { FiltersDropdown } from "@/components/issues/issue-layouts";
import { ViewFiltersSelection } from "@/components/views/filters/filter-selection";
import { ViewOrderByDropdown } from "@/components/views/filters/order-by";
// hooks
import { useMember, useProjectView } from "@/hooks/store";

export const ViewMobileHeader = observer(() => {
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  return (
    <>
      <div className="md:hidden flex justify-evenly border-b border-custom-border-200 py-2 z-[13] bg-custom-background-100">
        <Row className="flex flex-grow items-center justify-center border-l border-custom-border-200 text-sm text-custom-text-200">
          <ViewOrderByDropdown
            sortBy={filters.sortBy}
            sortKey={filters.sortKey}
            onChange={(val) => {
              if (val.key) updateFilters("sortKey", val.key);
              if (val.order) updateFilters("sortBy", val.order);
            }}
            isMobile
          />
        </Row>
        <div className="flex flex-grow items-center justify-center border-l border-custom-border-200 text-sm text-custom-text-200">
          <FiltersDropdown
            icon={<ListFilter className="h-3 w-3" />}
            title="Filters"
            placement="bottom-end"
            isFiltersApplied={false}
            menuButton={
              <Row className="flex items-center text-sm text-custom-text-200">
                Filters
                <ChevronDown className="ml-2 h-4 w-4 text-custom-text-200" strokeWidth={2} />
              </Row>
            }
          >
            <ViewFiltersSelection
              filters={filters}
              handleFiltersUpdate={updateFilters}
              memberIds={projectMemberIds ?? undefined}
            />
          </FiltersDropdown>
        </div>
      </div>
    </>
  );
});
