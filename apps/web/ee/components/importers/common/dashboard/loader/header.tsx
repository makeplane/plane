import { Loader } from "@plane/ui";

export const DashboardLoaderHeader = () => (
  <Loader>
    <div className="space-y-6">
      <Loader.Item height="26px" width="20%" />
      <Loader.Item height="60px" width="100%" />
    </div>
  </Loader>
);
