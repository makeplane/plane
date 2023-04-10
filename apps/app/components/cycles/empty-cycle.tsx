import React from "react";
import { LinearProgressIndicator } from "components/ui";

export const EmptyCycle = () => {
  const emptyCycleData = [
    {
      id: 1,
      name: "backlog",
      value: 20,
      color: "#DEE2E6",
    },
    {
      id: 2,
      name: "unstarted",
      value: 14,
      color: "#26B5CE",
    },
    {
      id: 3,
      name: "started",
      value: 27,
      color: "#F7AE59",
    },
    {
      id: 4,
      name: "cancelled",
      value: 15,
      color: "#D687FF",
    },
    {
      id: 5,
      name: "completed",
      value: 14,
      color: "#09A953",
    },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 ">
      <div className="relative h-32 w-72">
        <div className="absolute right-0 top-0 flex w-64 flex-col rounded-[10px] bg-brand-surface-2 text-xs shadow">
          <div className="flex flex-col items-start justify-center gap-2.5 p-3.5">
            <span className="text-sm font-semibold text-brand-base">Cycle Name</span>
            <div className="flex h-full w-full items-center gap-4">
              <span className="h-2 w-20 rounded-full bg-brand-surface-2" />
              <span className="h-2 w-20 rounded-full bg-brand-surface-2" />
            </div>
          </div>

          <div className="border-t border-brand-base bg-brand-surface-1 px-4 py-3">
            <LinearProgressIndicator data={emptyCycleData} />
          </div>
        </div>

        <div className="absolute left-0 bottom-0 flex w-64 flex-col rounded-[10px] bg-brand-surface-2 text-xs shadow">
          <div className="flex flex-col items-start justify-center gap-2.5 p-3.5">
            <span className="text-sm font-semibold text-brand-base">Cycle Name</span>
            <div className="flex h-full w-full items-center gap-4">
              <span className="h-2 w-20 rounded-full bg-brand-surface-2" />
              <span className="h-2 w-20 rounded-full bg-brand-surface-2" />
            </div>
          </div>

          <div className="border-t border-brand-base bg-brand-surface-1 px-4 py-3">
            <LinearProgressIndicator data={emptyCycleData} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 text-center ">
        <h3 className="text-xl font-semibold">Create New Cycle</h3>
        <p className="text-sm text-brand-secondary">
          Sprint more effectively with Cycles by confining your project <br /> to a fixed amount of
          time. Create new cycle now.
        </p>
      </div>
    </div>
  );
};
