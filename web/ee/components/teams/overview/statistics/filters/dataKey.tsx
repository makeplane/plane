import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { TStatisticsFilterProps, TTeamAnalyticsDataKeys } from "@plane/types";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TEAM_STATISTICS_DATA_KEY_MAP } from "@/plane-web/constants/teams";

export const StatisticsDataKeyFilter: React.FC<TStatisticsFilterProps<"data_key">> = observer((props) => {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // derived values
  const options = Object.entries(TEAM_STATISTICS_DATA_KEY_MAP).map(([data, value]) => ({
    data,
    value,
  }));

  return (
    <Dropdown
      value={value}
      options={options}
      onChange={(value) => handleFilterChange(value as TTeamAnalyticsDataKeys)}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center gap-1">
          {val && typeof val === "string"
            ? TEAM_STATISTICS_DATA_KEY_MAP[val as TTeamAnalyticsDataKeys]
            : TEAM_STATISTICS_DATA_KEY_MAP[value]}
          <ChevronDown className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
        </span>
      )}
      disableSearch
      disabled={isLoading}
    />
  );
});
