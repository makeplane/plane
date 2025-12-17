// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IUserProfileData, IUserStateDistribution } from "@plane/types";
import { Card } from "@plane/ui";
import { capitalizeFirstLetter } from "@plane/utils";

type Props = {
  stateDistribution: IUserStateDistribution[];
  userProfile: IUserProfileData | undefined;
};

export function ProfileStateDistribution({ stateDistribution, userProfile }: Props) {
  const { t } = useTranslation();
  if (!userProfile) return null;

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-16 font-medium">{t("profile.stats.state_distribution.title")}</h3>
      <Card className="h-full">
        {userProfile.state_distribution.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 w-full  h-[300px]">
            <PieChart
              className="size-full"
              dataKey="value"
              margin={{
                top: 0,
                right: -10,
                bottom: 12,
                left: -10,
              }}
              data={
                userProfile.state_distribution.map((group) => ({
                  id: group.state_group,
                  key: group.state_group,
                  value: group.state_count,
                  name: capitalizeFirstLetter(group.state_group),
                  color: STATE_GROUPS[group.state_group]?.color,
                })) ?? []
              }
              cells={userProfile.state_distribution.map((group) => ({
                key: group.state_group,
                fill: STATE_GROUPS[group.state_group]?.color,
              }))}
              showTooltip
              tooltipLabel="Count"
              paddingAngle={5}
              cornerRadius={4}
              innerRadius="50%"
              showLabel={false}
            />
            <div className="flex items-center">
              <div className="w-full space-y-4">
                {stateDistribution.map((group) => (
                  <div key={group.state_group} className="flex items-center justify-between gap-2 text-11">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-xs"
                        style={{
                          backgroundColor:
                            STATE_GROUPS[group.state_group]?.color ?? "var(--background-color-accent-primary)",
                        }}
                      />
                      <div className="whitespace-nowrap">{STATE_GROUPS[group.state_group].label}</div>
                    </div>
                    <div>{group.state_count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyStateCompact
            assetKey="priority"
            assetClassName="size-20"
            title={t("workspace_empty_state.your_work_by_priority.title")}
          />
        )}
      </Card>
    </div>
  );
}
