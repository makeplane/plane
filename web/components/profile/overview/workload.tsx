// types
import { IUserStateDistribution } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

type Props = {
  stateDistribution: IUserStateDistribution[];
};

export const ProfileWorkload: React.FC<Props> = ({ stateDistribution }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-medium">Workload</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 justify-stretch">
      {stateDistribution.map((group) => (
        <div key={group.state_group}>
          <a className="flex gap-2 p-4 rounded border border-custom-border-100 whitespace-nowrap">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: STATE_GROUP_COLORS[group.state_group],
              }}
            />
            <div className="space-y-1 -mt-1">
              <p className="text-custom-text-400 text-sm capitalize">
                {group.state_group === "unstarted"
                  ? "Not Started"
                  : group.state_group === "started"
                  ? "Working on"
                  : group.state_group}
              </p>
              <p className="text-xl font-semibold">{group.state_count}</p>
            </div>
          </a>
        </div>
      ))}
    </div>
  </div>
);
