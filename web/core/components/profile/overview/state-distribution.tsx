// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IUserProfileData, IUserStateDistribution } from "@plane/types";
// ui
import { Card } from "@plane/ui";
import { ProfileEmptyState, PieGraph } from "@/components/ui";
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
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            <div>
              <PieGraph
                data={
                  userProfile.state_distribution.map((group) => ({
                    id: group.state_group,
                    label: group.state_group,
                    value: group.state_count,
                    color: STATE_GROUPS[group.state_group]?.color ?? "rgb(var(--color-primary-100))",
                  })) ?? []
                }
                height="250px"
                innerRadius={0.6}
                cornerRadius={5}
                padAngle={2}
                enableArcLabels
                arcLabelsTextColor="#000000"
                enableArcLinkLabels={false}
                activeInnerRadiusOffset={5}
                colors={(datum) => datum?.data?.color}
                tooltip={(datum) => (
                  <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 p-2 text-xs">
                    <span className="capitalize text-custom-text-200">{datum.datum.label} work items:</span>{" "}
                    {datum.datum.value}
                  </div>
                )}
                margin={{
                  top: 32,
                  right: 0,
                  bottom: 32,
                  left: 0,
                }}
              />
            </div>
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
