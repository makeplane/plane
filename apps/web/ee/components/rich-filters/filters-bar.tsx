import React from "react";
import { observer } from "mobx-react";
import { Transition } from "@headlessui/react";
// plane imports
import { Button, EHeaderVariant, Header } from "@plane/ui";
// plane web imports
import { IFilterInstance } from "@/plane-web/store/rich-filters/filter";
// local imports
import { AddFilterButton, TAddFilterButtonProps } from "./add-filters-button";
import { FilterItem } from "./filter-item";

type TFilterBarProps<FilterPropertyKey extends string, TExternalFilterType> = {
  filter: IFilterInstance<FilterPropertyKey, TExternalFilterType>;
  visible?: boolean;
  buttonConfig?: TAddFilterButtonProps<FilterPropertyKey, TExternalFilterType>["buttonConfig"];
};

export const FilterBar = observer(
  <FilterPropertyKey extends string, TExternalFilterType>(
    props: TFilterBarProps<FilterPropertyKey, TExternalFilterType>
  ) => {
    const { filter, buttonConfig } = props;
    return (
      <Header variant={EHeaderVariant.TERNARY}>
        <Header.LeftItem className="flex gap-3 flex-wrap transition-all duration-300 ease-in-out">
          <AddFilterButton filter={filter} buttonConfig={buttonConfig} />
          {filter.allConditions.map((condition) => (
            <FilterItem key={condition.id} filter={filter} condition={condition} />
          ))}
        </Header.LeftItem>
        <Header.RightItem>
          <Transition
            show={filter.allConditions.length > 0}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Button variant="neutral-primary" size="sm" className="py-1" onClick={() => filter.clearFilters()}>
              Clear all
            </Button>
          </Transition>
        </Header.RightItem>
      </Header>
    );
  }
);
