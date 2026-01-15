import React from "react";
import { observer } from "mobx-react";
// plane imports
import { CloseIcon } from "@plane/propel/icons";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";

interface FilterItemCloseButtonProps<P extends TFilterProperty, E extends TExternalFilter> {
  conditionId: string;
  filter: IFilterInstance<P, E>;
}

export const FilterItemCloseButton = observer(function FilterItemCloseButton<
  P extends TFilterProperty,
  E extends TExternalFilter,
>(props: FilterItemCloseButtonProps<P, E>) {
  const { conditionId, filter } = props;

  const handleRemoveFilter = () => {
    filter.removeCondition(conditionId);
  };

  return (
    <button
      onClick={handleRemoveFilter}
      className="px-1.5 text-placeholder hover:text-tertiary focus:outline-none bg-layer-transparent hover:bg-layer-transparent-hover"
      type="button"
      aria-label="Remove filter"
    >
      <CloseIcon className="size-3.5" />
    </button>
  );
});
