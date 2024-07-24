import React, { FC } from "react";
import { observer } from "mobx-react";
import { Check, ListFilter } from "lucide-react";
import { Button, PopoverMenu } from "@plane/ui";
// helper
import { cn } from "@/helpers/common.helper";
// constants
import { TActivityFilterOption, TActivityFilters } from "@/plane-web/constants/issues";

type TActivityFilter = {
  selectedFilters: TActivityFilters[];
  filterOptions: TActivityFilterOption[];
};

export const ActivityFilter: FC<TActivityFilter> = observer((props) => {
  const { selectedFilters = [], filterOptions } = props;

  return (
    <PopoverMenu
      buttonClassName="outline-none"
      button={
        <Button
          variant="neutral-primary"
          size="sm"
          prependIcon={<ListFilter className="h-3 w-3" />}
          className="relative"
        >
          <span className="text-custom-text-200">Filters</span>
        </Button>
      }
      panelClassName="p-2 rounded-md border border-custom-border-200 bg-custom-background-100"
      data={filterOptions}
      keyExtractor={(item) => item.key}
      render={(item) => (
        <div
          key={item.key}
          className="flex items-center gap-2 text-sm cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
          onClick={item.onClick}
        >
          <div
            className={cn(
              "flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-sm transition-all bg-custom-background-90",
              {
                "bg-custom-primary text-white": item.isSelected,
                "bg-custom-background-80 text-custom-text-400": item.isSelected && selectedFilters.length === 1,
                "bg-custom-background-90": !item.isSelected,
              }
            )}
          >
            {item.isSelected && <Check className="h-2.5 w-2.5" />}
          </div>
          <div className={cn("whitespace-nowrap", item.isSelected ? "text-custom-text-100" : "text-custom-text-200")}>
            {item.label}
          </div>
        </div>
      )}
    />
  );
});
