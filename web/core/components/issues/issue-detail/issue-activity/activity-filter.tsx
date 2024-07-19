import React, { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { Check, ListFilter } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
// helper
import { cn } from "@/helpers/common.helper";
// constants
import { TActivityFilters, ACTIVITY_FILTER_TYPE_OPTIONS } from "@/plane-web/constants/issues";

type Props = {
  selectedFilters: TActivityFilters[];
  toggleFilter: (filter: TActivityFilters) => void;
};

export const ActivityFilter: FC<Props> = observer((props) => {
  const { selectedFilters, toggleFilter } = props;
  return (
    <Popover as="div" className="relative">
      {({ open }) => (
        <>
          <Popover.Button as={React.Fragment}>
            <Button
              variant="neutral-primary"
              size="sm"
              prependIcon={<ListFilter className="h-3 w-3" />}
              className="relative"
            >
              <span className={`${open ? "text-custom-text-100" : "text-custom-text-200"}`}>Filters</span>
            </Button>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute mt-2 right-0 z-10 min-w-40">
              <div className="p-2 rounded-md border border-custom-border-200 bg-custom-background-100">
                {Object.keys(ACTIVITY_FILTER_TYPE_OPTIONS).map((key) => {
                  const filterKey = key as TActivityFilters;
                  const filter = ACTIVITY_FILTER_TYPE_OPTIONS[filterKey];
                  const isSelected = selectedFilters.includes(filterKey);
                  return (
                    <div
                      key={filterKey}
                      className="flex items-center gap-2 text-sm cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                      onClick={() => toggleFilter(filterKey)}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-sm transition-all bg-custom-background-90",
                          {
                            "bg-custom-primary text-white": isSelected,
                            "bg-custom-background-80 text-custom-text-400": isSelected && selectedFilters.length === 1,
                            "bg-custom-background-90": !isSelected,
                          }
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <div
                        className={cn(
                          "whitespace-nowrap",
                          isSelected ? "text-custom-text-100" : "text-custom-text-200"
                        )}
                      >
                        {filter.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
});
