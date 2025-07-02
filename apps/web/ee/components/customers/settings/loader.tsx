import { FC } from "react";
import { Loader } from "@plane/ui";
export const CustomerPropertiesLoader: FC = () => (
  <Loader className="space-y-4">
    <Loader.Item height="100px" width="100%" />
    <Loader.Item height="100px" width="100%" />
  </Loader>
);
