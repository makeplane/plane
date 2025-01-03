import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { TStatisticsFilterProps } from "@plane/types";
import { MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { DATE_AFTER_FILTER_OPTIONS } from "@/constants/filters";

export const StatisticsDueByFilter: React.FC<TStatisticsFilterProps<"target_date">> = observer((props) => {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // state
  const [localValue, setLocalValue] = useState<string[]>(value || []);
  // derived values
  const options = DATE_AFTER_FILTER_OPTIONS.map((filterOption) => ({
    data: filterOption.value,
    value: filterOption.name,
  }));

  return (
    <MultiSelectDropdown
      value={localValue}
      options={options}
      onChange={(value) => setLocalValue(value)}
      onClose={() => handleFilterChange(localValue)}
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
