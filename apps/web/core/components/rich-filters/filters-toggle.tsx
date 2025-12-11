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
  "grid place-items-center h-7 w-full py-0.5 px-2 rounded-md border border-subtle-1 transition-all duration-200 cursor-pointer";

export const FiltersToggle = observer(function FiltersToggle<P extends TFilterProperty, E extends TExternalFilter>(
  props: TFiltersToggleProps<P, E>
) {
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
          variant: "secondary",
          className: COMMON_CLASSNAME,
          label: null,
        }}
        onFilterSelect={() => filter?.toggleVisibility(true)}
      />
    );
  }

  return (
    <button
      className={cn(COMMON_CLASSNAME, {
        "border-transparent bg-accent-primary/10 hover:bg-accent-primary/20": isFilterRowVisible,
        "hover:bg-surface-1": !isFilterRowVisible,
      })}
      onClick={handleToggleFilter}
    >
      <div className="relative">
        <ListFilter
          className={cn("size-4", {
            "text-accent-primary": isFilterRowVisible,
            "text-tertiary": !isFilterRowVisible,
          })}
        />
        {showFilterRowChangesPill && (
          <span
            className={cn("p-[3px] rounded-full bg-accent-primary absolute top-[0.2px] -right-[0.4px]", {
              "bg-layer-1": hasAnyConditions === false && filter?.hasChanges === true, // If there are no conditions and there are changes, show the pill in the background color
            })}
          />
        )}
      </div>
    </button>
  );
});
