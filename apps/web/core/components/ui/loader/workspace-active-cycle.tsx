import React, { FC } from "react";

type Props = {
  itemCount?: number;
};

const WorkspaceActiveCycleLoaderItem = () => (
  <div className="px-5 pt-5 last:pb-5">
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-custom-border-200 bg-custom-background-100">
      <div className="flex items-center gap-1.5">
        <span className="size-7 bg-custom-background-80 rounded" />
        <span className="h-7 w-20 bg-custom-background-80 rounded" />
      </div>
      <div className="flex items-center justify-between px-3 py-2 rounded border-[0.5px] border-custom-border-100 bg-custom-background-90">
        <div className="flex items-center gap-2 cursor-default">
          <span className="size-6 bg-custom-background-80 rounded" />
          <span className="h-6 w-14 bg-custom-background-80 rounded" />
          <span className="h-6 w-16 bg-custom-background-80 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <span className="h-6 w-16 bg-custom-background-80 rounded" />
          <span className="h-6 w-20 bg-custom-background-80 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <span className="flex flex-col min-h-[17rem] border border-custom-border-200 rounded-lg bg-custom-background-80" />
        <span className="flex flex-col min-h-[17rem] border border-custom-border-200 rounded-lg bg-custom-background-80" />
        <span className="flex flex-col min-h-[17rem] border border-custom-border-200 rounded-lg bg-custom-background-80" />
      </div>
    </div>
  </div>
);

export const WorkspaceActiveCycleLoader: FC<Props> = ({ itemCount = 2 }) => (
  <div className="h-full w-full overflow-y-scroll bg-custom-background-90 vertical-scrollbar scrollbar-md animate-pulse">
    {[...Array(itemCount)].map((_, index) => (
      <WorkspaceActiveCycleLoaderItem key={index} />
    ))}
  </div>
);
