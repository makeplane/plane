import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
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

  // theme
  const { resolvedTheme } = useTheme();

  const resolvedEmptyStatePath = `/empty-state/active-cycle/cycle-${resolvedTheme === "light" ? "light" : "dark"}.webp`;

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
        <div className="flex items-center justify-center h-full w-full py-20">
          <div className="text-center flex flex-col gap-2.5 items-center">
            <div className="h-24 w-24">
              <Image
                src={resolvedEmptyStatePath}
                alt="button image"
                width={78}
                height={78}
                layout="responsive"
                lazyBoundary="100%"
              />
            </div>
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
