// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PieChart } from "@plane/propel/charts/pie-chart";
import { IUserProfileData, IUserStateDistribution } from "@plane/types";
// ui
import { Card } from "@plane/ui";
import { capitalizeFirstLetter } from "@plane/utils";
import { ProfileEmptyState } from "@/components/ui";
// helpers
// image
import stateGraph from "@/public/empty-state/state_graph.svg";

type Props = {
  stateDistribution: IUserStateDistribution[];
  userProfile: IUserProfileData | undefined;
};

export const ProfileStateDistribution: React.FC<Props> = ({ stateDistribution, userProfile }) => {
  const { t } = useTranslation();
  if (!userProfile) return null;

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-lg font-medium">{t("profile.stats.state_distribution.title")}</h3>
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
                  <div key={group.state_group} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{
                          backgroundColor: STATE_GROUPS[group.state_group]?.color ?? "rgb(var(--color-primary-100))",
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
          <ProfileEmptyState
            title={t("no_data_yet")}
            description={t("profile.stats.state_distribution.empty")}
            image={stateGraph}
          />
        )}
      </Card>
    </div>
  );
};
