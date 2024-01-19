// ui
import { Loader } from "@plane/ui";

export const RecentActivityWidgetLoader = () => (
  <Loader className="bg-custom-background-100 rounded-xl p-6 space-y-6">
    <Loader.Item height="17px" width="35%" />
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={index} className="flex items-start gap-3.5">
        <div className="flex-shrink-0">
          <Loader.Item height="16px" width="16px" />
        </div>
        <div className="space-y-3 flex-shrink-0 w-full">
          <Loader.Item height="15px" width="70%" />
          <Loader.Item height="11px" width="10%" />
        </div>
      </div>
    ))}
  </Loader>
);
