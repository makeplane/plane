// types
import { IUserStateDistribution } from "@plane/types";
import { BoxContainer } from "@/components/containers";
import { STATE_GROUPS } from "@/constants/state";
// constants

type Props = {
  stateDistribution: IUserStateDistribution[];
};

export const ProfileWorkload: React.FC<Props> = ({ stateDistribution }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-medium">Workload</h3>
    <div className="grid grid-cols-1 justify-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stateDistribution.map((group) => (
        <BoxContainer key={group.state_group} className="flex gap-2 p-4">
          <div
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: STATE_GROUPS[group.state_group].color,
            }}
          />
          <div className="-mt-1 space-y-1">
            <p className="text-sm text-custom-text-400">
              {group.state_group === "unstarted"
                ? "Not started"
                : group.state_group === "started"
                  ? "Working on"
                  : STATE_GROUPS[group.state_group].label}
            </p>
            <p className="text-xl font-semibold">{group.state_count}</p>
          </div>
        </BoxContainer>
      ))}
    </div>
  </div>
);
