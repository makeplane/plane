// ui
import { Loader } from "@plane/ui";

export const RecentCollaboratorsWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl p-6 space-y-9">
    <Loader.Item height="17px" width="20%" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="space-y-11 flex flex-col items-center">
          <div className="rounded-full overflow-hidden h-[69px] w-[69px]">
            <Loader.Item height="69px" width="69px" />
          </div>
          <Loader.Item height="11px" width="70%" />
        </div>
      ))}
    </div>
  </Loader>
);
