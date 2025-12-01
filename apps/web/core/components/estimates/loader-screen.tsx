import type { FC } from "react";
import { Loader } from "@plane/ui";

export function EstimateLoaderScreen() {
  return (
    <Loader className="mt-5 space-y-5">
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
      <Loader.Item height="40px" />
    </Loader>
  );
}
