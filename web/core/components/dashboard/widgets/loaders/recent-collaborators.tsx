"use client";

// ui
import { Loader } from "@plane/ui";

export const RecentCollaboratorsWidgetLoader = () => (
  <>
    {Array.from({ length: 8 }).map((_, index) => (
      <Loader key={index} className="bg-custom-background-100 rounded-xl px-6 pb-12">
        <div className="space-y-11 flex flex-col items-center">
          <div className="rounded-full overflow-hidden h-[69px] w-[69px]">
            <Loader.Item height="69px" width="69px" />
          </div>
          <Loader.Item height="11px" width="70%" />
        </div>
      </Loader>
    ))}
  </>
);
