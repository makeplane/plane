import { Command } from "cmdk";
// plane ui
import { Loader } from "@plane/ui";

export const PowerKLoader = () => (
  <Command.Loading>
    <Loader className="space-y-3">
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
    </Loader>
  </Command.Loading>
);
