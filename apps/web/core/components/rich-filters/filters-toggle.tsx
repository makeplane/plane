import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
import { cn } from "@plane/ui";
// components
import { AddFilterButton } from "@/components/rich-filters/add-filters/button";

type TFiltersToggleProps<P extends TFilterProperty, E extends TExternalFilter> = {
  filter: IFilterInstance<P, E> | undefined;
};

const COMMON_CLASSNAME =
  "grid place-items-center h-7 w-full py-0.5 px-2 rounded border transition-all duration-200 cursor-pointer";

export const FiltersToggle = observer(
  <P extends TFilterProperty, E extends TExternalFilter>(props: TFiltersToggleProps<P, E>) => {
    const { filter } = props;
    // derived values
    const hasAnyConditions = (filter?.allConditionsForDisplay.length ?? 0) > 0;
    const isFilterRowVisible = filter?.isVisible ?? false;
    const hasUpdates = filter?.canUpdateView === true && filter?.hasChanges === true;
    const showFilterRowChangesPill = hasUpdates || hasAnyConditions === true;
    const showAddFilterButton = !hasAnyConditions && !isFilterRowVisible && !hasUpdates;

    const handleToggleFilter = () => {
      if (!filter) {
        console.error("Filters toggle error - filter instance not available");
        return;
      }
      filter.toggleVisibility();
    };

    // Show the add filter button when there are no active conditions, the filter row is hidden, and no unsaved changes exist
    if (filter && showAddFilterButton) {
      return (
        <AddFilterButton
          filter={filter}
          buttonConfig={{
            variant: "neutral-primary",
            className: COMMON_CLASSNAME,
            label: null,
          }}
          onFilterSelect={() => filter?.toggleVisibility(true)}
        />
      );
    }

    return (
      <div
        className={cn(COMMON_CLASSNAME, {
          "border-transparent bg-custom-primary-100/10 hover:bg-custom-primary-100/20": isFilterRowVisible,
          "border-custom-border-200 hover:bg-custom-background-90": !isFilterRowVisible,
        })}
        onClick={handleToggleFilter}
      >
        <div className="relative">
          <ListFilter
            className={cn("size-4", {
              "text-custom-primary-100": isFilterRowVisible,
              "text-custom-text-300": !isFilterRowVisible,
            })}
          />
          {showFilterRowChangesPill && (
            <span
              className={cn("p-[3px] rounded-full bg-custom-primary-100 absolute top-[0.2px] -right-[0.4px]", {
                "bg-custom-text-300": hasAnyConditions === false && filter?.hasChanges === true, // If there are no conditions and there are changes, show the pill in the background color
              })}
            />
          )}
        </div>
      </div>
    );
  }
);
