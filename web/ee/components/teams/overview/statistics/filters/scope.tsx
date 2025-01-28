import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { Tab } from "@headlessui/react";
import { ETeamEntityScope } from "@plane/constants";
import { TabList } from "@plane/ui";
// plane web imports
import { getTeamEntityScopeLabel } from "@/plane-web/helpers/team-helper";
import { TStatisticsFilterProps } from "@/plane-web/types/teams";

export const StatisticsScope: React.FC<TStatisticsFilterProps<"scope">> = observer((props) => {
  const { value, isLoading, handleFilterChange } = props;
  // derived values
  const TEAM_STATISTICS_SCOPE = useMemo(
    () => [
      {
        key: ETeamEntityScope.TEAM,
        label: getTeamEntityScopeLabel(ETeamEntityScope.TEAM),
        onClick: () => handleFilterChange(ETeamEntityScope.TEAM),
        disabled: isLoading,
      },
      {
        key: ETeamEntityScope.PROJECT,
        label: getTeamEntityScopeLabel(ETeamEntityScope.PROJECT),
        onClick: () => handleFilterChange(ETeamEntityScope.PROJECT),
        disabled: isLoading,
      },
    ],
    [handleFilterChange, isLoading]
  );

  return (
    <Tab.Group>
      <TabList tabs={TEAM_STATISTICS_SCOPE} selectedTab={value} size="sm" tabListClassName="w-36" />
    </Tab.Group>
  );
});
