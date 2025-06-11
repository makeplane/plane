import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { EStatisticsLegend } from "@plane/constants";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { TEAM_STATISTICS_LEGEND_MAP } from "@/plane-web/constants/teamspace";
import {
  WORKSPACE_PROJECT_STATE_GROUPS,
  WORKSPACE_PROJECT_STATE_PRIORITY,
} from "@/plane-web/constants/workspace-project-states";
import { TStatisticsFilterProps } from "@/plane-web/types/teamspace";

export const StatisticsLegend: React.FC<TStatisticsFilterProps<"legend">> = observer((props) => {
  const { value, isLoading, buttonContainerClassName, chevronClassName, handleFilterChange } = props;
  // derived values
  const options = Object.entries(TEAM_STATISTICS_LEGEND_MAP).map(([data, value]) => ({
    data,
    value,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-6 text-sm pt-4 pb-2 px-1.5">
      <div className="flex items-center gap-2 text-custom-text-300">
        <span className="flex-shrink-0">Legend as</span>
        <Dropdown
          value={value}
          options={options}
          onChange={(value) => handleFilterChange(value as EStatisticsLegend)}
          keyExtractor={(option) => option.data}
          buttonContainerClassName={buttonContainerClassName}
          buttonContent={(isOpen, val) => (
            <span className="flex items-center gap-1">
              {val && typeof val === "string"
                ? TEAM_STATISTICS_LEGEND_MAP[val as EStatisticsLegend]
                : TEAM_STATISTICS_LEGEND_MAP[value]}
              <ChevronDown className={cn(chevronClassName, isOpen ? "rotate-180" : "rotate-0")} />
            </span>
          )}
          disableSearch
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-custom-text-200 font-medium">
        {value === "state" && (
          <>
            {Object.values(WORKSPACE_PROJECT_STATE_GROUPS).map((group) => (
              <div key={group.title} className="flex items-center gap-1.5">
                <div className="size-3.5 rounded-sm" style={{ backgroundColor: group.background }} />
                <span>{group.title}</span>
              </div>
            ))}
          </>
        )}
        {value === "priority" && (
          <>
            {Object.values(WORKSPACE_PROJECT_STATE_PRIORITY).map((priority) => (
              <div key={priority.title} className="flex items-center gap-1.5">
                <div className={cn("size-3.5 rounded-sm")} style={{ backgroundColor: priority.background }} />
                <span>{priority.title}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
});
