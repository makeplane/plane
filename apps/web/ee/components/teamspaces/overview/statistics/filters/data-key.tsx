import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { ETeamspaceAnalyticsDataKeys } from "@plane/constants";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TEAM_STATISTICS_DATA_KEY_MAP } from "@/plane-web/constants/teamspace";
import { TStatisticsFilterProps } from "@/plane-web/types/teamspace";

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
      onChange={(value) => handleFilterChange(value as ETeamspaceAnalyticsDataKeys)}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center gap-1">
          {val && typeof val === "string"
            ? TEAM_STATISTICS_DATA_KEY_MAP[val as ETeamspaceAnalyticsDataKeys]
            : TEAM_STATISTICS_DATA_KEY_MAP[value]}
          <ChevronDown className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
        </span>
      )}
      disableSearch
      disabled={isLoading}
    />
  );
});
