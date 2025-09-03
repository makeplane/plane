"use client";

import { Loader } from "@plane/ui";

export const EstimateLoaderScreen: React.FC = () => (
  <Loader className="mt-5 space-y-5">
    <Loader.Item height="40px" />
    <Loader.Item height="40px" />
    <Loader.Item height="40px" />
    <Loader.Item height="40px" />
  </Loader>
);
