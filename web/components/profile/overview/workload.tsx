// types
import { IUserStateDistribution } from "@plane/types";
// constants
import { STATE_GROUPS } from "constants/state";

type Props = {
  stateDistribution: IUserStateDistribution[];
};

export const ProfileWorkload: React.FC<Props> = ({ stateDistribution }) => (
  <div className="space-y-2">
    <h3 className="text-lg font-medium">Workload</h3>
    <div className="grid grid-cols-1 justify-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stateDistribution.map((group) => (
        <div key={group.state_group}>
          <a className="flex gap-2 whitespace-nowrap rounded border border-custom-border-100 p-4">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: STATE_GROUPS[group.state_group].color,
              }}
            />
            <div className="-mt-1 space-y-1">
              <p className="text-sm capitalize text-custom-text-400">
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
