import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane constants
import { DATE_AFTER_FILTER_OPTIONS } from "@plane/constants";
// plane imports
import { MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TStatisticsFilterProps } from "@/plane-web/types/teamspace";

export const StatisticsDueByFilter: React.FC<TStatisticsFilterProps<"target_date">> = observer((props) => {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // derived values
  const options = DATE_AFTER_FILTER_OPTIONS.map((filterOption) => ({
    data: filterOption.value,
    value: filterOption.name,
  }));

  return (
    <MultiSelectDropdown
      value={value}
      options={options}
      onChange={(value) => handleFilterChange(value)}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center gap-1">
          {val && val.length > 0 ? `${val.length} selected` : "Due by"}
          <ChevronDown className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
        </span>
      )}
      disableSearch
      disabled={isLoading}
    />
  );
});
