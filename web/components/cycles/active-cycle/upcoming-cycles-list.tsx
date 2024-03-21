import { FC } from "react";
import { observer } from "mobx-react";
// components
import { UpcomingCycleListItem } from "@/components/cycles";
// hooks
import { useCycle } from "@/hooks/store";

type Props = {
  handleEmptyStateAction: () => void;
};

export const UpcomingCyclesList: FC<Props> = observer((props) => {
  const { handleEmptyStateAction } = props;
  // store hooks
  const { currentProjectUpcomingCycleIds } = useCycle();

  if (!currentProjectUpcomingCycleIds) return null;

  return (
    <div>
      <div className="bg-custom-background-80 font-semibold text-sm py-1 px-2 rounded inline-block text-custom-text-400">
        Next cycles
      </div>
      {currentProjectUpcomingCycleIds.length > 0 ? (
        <div className="mt-2 divide-y-[0.5px] divide-custom-border-200 border-b-[0.5px] border-custom-border-200">
          {currentProjectUpcomingCycleIds.map((cycleId) => (
            <UpcomingCycleListItem key={cycleId} cycleId={cycleId} />
          ))}
        </div>
      ) : (
        <div className="w-full grid place-items-center py-20">
          <div className="text-center">
            <h5 className="text-xl font-medium mb-1">No upcoming cycles</h5>
            <p className="text-custom-text-400 text-base">
              Create new cycles to find them here or check
              <br />
              {"'"}All{"'"} cycles tab to see all cycles or{" "}
              <button type="button" className="text-custom-primary-100 font-medium" onClick={handleEmptyStateAction}>
                click here
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
