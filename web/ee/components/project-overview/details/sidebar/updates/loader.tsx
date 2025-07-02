import { Loader } from "@plane/ui";

export const UpdatesLoader = () => (
  <Loader className="flex flex-col gap-4 py-4">
    <Loader.Item height="125px" width="100%" />
    <Loader.Item height="125px" width="100%" />
    <Loader.Item height="125px" width="100%" />
  </Loader>
);
