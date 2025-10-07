import React from "react";
import { observer } from "mobx-react";
import { CircleAlert } from "lucide-react";
// plane imports
import { TExternalFilter, TFilterProperty } from "@plane/types";
// local imports
import { FilterItemCloseButton } from "./close-button";
import { FilterItemContainer } from "./container";
import { FilterItemProperty } from "./property";
import { IFilterItemProps } from "./root";

export const InvalidFilterItem = observer(
  <P extends TFilterProperty, E extends TExternalFilter>(props: IFilterItemProps<P, E>) => {
    const { condition, filter, isDisabled = false, showTransition = true } = props;

    return (
      <FilterItemContainer
        conditionValue={condition.value}
        showTransition={showTransition}
        variant="error"
        tooltipContent="This filter condition is no longer valid. The property may have been deleted or your access to it may have changed."
      >
        {/* Property section */}
        <FilterItemProperty icon={CircleAlert} label="Invalid filter" />
        {/* Remove button */}
        {!isDisabled && <FilterItemCloseButton conditionId={condition.id} filter={filter} />}
      </FilterItemContainer>
    );
  }
);
