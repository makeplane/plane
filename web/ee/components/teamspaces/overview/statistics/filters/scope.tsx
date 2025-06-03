import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETeamspaceEntityScope } from "@plane/constants";
import { TabList } from "@plane/ui";
// plane web imports
import { getTeamspaceEntityScopeLabel } from "@/plane-web/helpers/teamspace-helper";
import { TStatisticsFilterProps } from "@/plane-web/types/teamspace";

export const StatisticsScope: React.FC<TStatisticsFilterProps<"scope">> = observer((props) => {
  const { value, isLoading, handleFilterChange } = props;
  // derived values
  const TEAM_STATISTICS_SCOPE = useMemo(
    () => [
      {
        key: ETeamspaceEntityScope.TEAM,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.TEAM),
        onClick: () => handleFilterChange(ETeamspaceEntityScope.TEAM),
        disabled: isLoading,
      },
      {
        key: ETeamspaceEntityScope.PROJECT,
        label: getTeamspaceEntityScopeLabel(ETeamspaceEntityScope.PROJECT),
        onClick: () => handleFilterChange(ETeamspaceEntityScope.PROJECT),
        disabled: isLoading,
      },
    ],
    [handleFilterChange, isLoading]
  );

  return <TabList tabs={TEAM_STATISTICS_SCOPE} selectedTab={value} size="sm" tabListClassName="w-36" />;
});
