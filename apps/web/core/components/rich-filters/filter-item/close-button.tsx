import React from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";

interface FilterItemCloseButtonProps<P extends TFilterProperty, E extends TExternalFilter> {
  conditionId: string;
  filter: IFilterInstance<P, E>;
}

export const FilterItemCloseButton = observer(
  <P extends TFilterProperty, E extends TExternalFilter>(props: FilterItemCloseButtonProps<P, E>) => {
    const { conditionId, filter } = props;

    const handleRemoveFilter = () => {
      filter.removeCondition(conditionId);
    };

    return (
      <button
        onClick={handleRemoveFilter}
        className="px-1.5 text-custom-text-400 hover:text-custom-text-300 focus:outline-none hover:bg-custom-background-90"
        type="button"
        aria-label="Remove filter"
      >
        <X className="size-3.5" />
      </button>
    );
  }
);
