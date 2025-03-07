import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { TStateGroups } from "@plane/types";
import { MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TStatisticsFilterProps } from "@/plane-web/types/teamspace";

export const StatisticsStateGroupFilter: React.FC<TStatisticsFilterProps<"state_group">> = observer((props) => {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // derived values
  const options = Object.values(STATE_GROUPS).map((stateGroup) => ({
    data: stateGroup.key,
    value: stateGroup.label,
  }));

  return (
    <MultiSelectDropdown
      value={value}
      options={options}
      onChange={(value) => handleFilterChange(value as TStateGroups[])}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center gap-1">
          {val && val.length > 0 ? `${val.length} group selected` : "State group"}
          <ChevronDown className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
        </span>
      )}
      disableSearch
      disabled={isLoading}
    />
  );
});
