import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { ETeamspaceAnalyticsValueKeys } from "@plane/constants";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TEAM_STATISTICS_VALUE_KEY_MAP } from "@/plane-web/constants/teamspace";
import { TStatisticsFilterProps } from "@/plane-web/types";

export const StatisticsValueKeyFilter: React.FC<TStatisticsFilterProps<"value_key">> = observer((props) => {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // derived values
  const options = Object.entries(TEAM_STATISTICS_VALUE_KEY_MAP).map(([data, value]) => ({
    data,
    value,
  }));

  return (
    <Dropdown
      value={value}
      options={options}
      onChange={(value) => handleFilterChange(value as ETeamspaceAnalyticsValueKeys)}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center gap-1">
          {val && typeof val === "string"
            ? TEAM_STATISTICS_VALUE_KEY_MAP[val as ETeamspaceAnalyticsValueKeys]
            : TEAM_STATISTICS_VALUE_KEY_MAP[value]}
          <ChevronDown className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
        </span>
      )}
      disableSearch
      disabled={isLoading}
    />
  );
});
