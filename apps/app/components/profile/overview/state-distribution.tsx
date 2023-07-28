// ui
import { PieGraph } from "components/ui";
// types
import { IUserProfileData, IUserStateDistribution } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  stateDistribution: IUserStateDistribution[];
  userProfile: IUserProfileData | undefined;
};

export const ProfileStateDistribution: React.FC<Props> = ({ stateDistribution, userProfile }) => {
  if (!userProfile) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Issues by State</h3>
      <div className="border border-custom-border-100 rounded p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div>
            <PieGraph
              data={
                userProfile.state_distribution.map((group) => ({
                  id: group.state_group,
                  label: group.state_group,
                  value: group.state_count,
                  color: STATE_GROUP_COLORS[group.state_group],
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
              colors={(datum) => datum.data.color}
              tooltip={(datum) => (
                <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 p-2 text-xs">
                  <span className="text-custom-text-200 capitalize">
                    {datum.datum.label} issues:
                  </span>{" "}
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
            <div className="space-y-4 w-full">
              {stateDistribution.map((group) => (
                <div
                  key={group.state_group}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        backgroundColor: STATE_GROUP_COLORS[group.state_group],
                      }}
                    />
                    <div className="capitalize whitespace-nowrap">{group.state_group}</div>
                  </div>
                  <div>{group.state_count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
