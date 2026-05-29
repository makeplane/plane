import { observer } from "mobx-react";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { FilterIcon, FilterAppliedIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";
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

  // Base classes when filter is active
  const activeFilterBaseClasses =
    "text-accent-primary border border-accent-subtle-1 hover:border-accent-subtle-1 active:border-accent-subtle-1 focus:border-accent-subtle-1";

  // State classes that prevent hover/active/focus color changes
  const noHoverStateClasses = "hover:text-accent-primary active:text-accent-primary focus:text-accent-primary";

  // Background classes based on toggle state (darker when open, lighter when closed)
  const backgroundClasses = isFilterRowVisible
    ? "bg-accent-subtle-hover hover:bg-accent-subtle-hover active:bg-accent-subtle-hover focus:bg-accent-subtle-hover"
    : "bg-accent-subtle hover:bg-accent-subtle active:bg-accent-subtle focus:bg-accent-subtle";

  const buttonClassName = cn({
    [activeFilterBaseClasses]: showFilterRowChangesPill,
    [backgroundClasses]: showFilterRowChangesPill,
    [noHoverStateClasses]: showFilterRowChangesPill,
  });

  const iconClassName = cn({
    "text-accent-primary [&_path]:fill-current": showFilterRowChangesPill,
  });

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
    <IconButton
      size="lg"
      variant="secondary"
      icon={showFilterRowChangesPill ? FilterAppliedIcon : FilterIcon}
      onClick={handleToggleFilter}
      className={buttonClassName}
      iconClassName={iconClassName}
    />
  );
});
