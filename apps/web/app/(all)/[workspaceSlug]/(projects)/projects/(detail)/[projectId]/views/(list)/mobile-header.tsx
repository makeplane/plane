import { observer } from "mobx-react";
// icons
import { ListFilter } from "lucide-react";
import { ChevronDownIcon } from "@plane/propel/icons";
// components
import { Row } from "@plane/ui";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { ViewFiltersSelection } from "@/components/views/filters/filter-selection";
import { ViewOrderByDropdown } from "@/components/views/filters/order-by";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";

export const ViewMobileHeader = observer(function ViewMobileHeader() {
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  return (
    <>
      <div className="md:hidden flex justify-evenly border-b border-subtle py-2 z-[13] bg-surface-1">
        <Row className="flex flex-grow items-center justify-center border-l border-subtle text-13 text-secondary">
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
        <div className="flex flex-grow items-center justify-center border-l border-subtle text-13 text-secondary">
          <FiltersDropdown
            icon={<ListFilter className="h-3 w-3" />}
            title="Filters"
            placement="bottom-end"
            isFiltersApplied={false}
            menuButton={
              <Row className="flex items-center text-13 text-secondary">
                Filters
                <ChevronDownIcon className="ml-2 h-4 w-4 text-secondary" strokeWidth={2} />
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
