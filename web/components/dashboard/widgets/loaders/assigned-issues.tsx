// ui
import { Loader } from "@plane/ui";

export const AssignedIssuesWidgetLoader = () => (
  <Loader className="bg-custom-background-100 p-6 rounded-xl">
    <div className="flex items-center justify-between gap-2">
      <Loader.Item height="17px" width="35%" />
      <Loader.Item height="17px" width="10%" />
    </div>
    <div className="mt-6 space-y-7">
      <Loader.Item height="29px" />
      <Loader.Item height="17px" width="10%" />
    </div>
    <div className="mt-11 space-y-10">
      <Loader.Item height="11px" width="35%" />
      <Loader.Item height="11px" width="45%" />
      <Loader.Item height="11px" width="55%" />
      <Loader.Item height="11px" width="40%" />
      <Loader.Item height="11px" width="60%" />
    </div>
  </Loader>
);
