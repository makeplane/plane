"use client";

import { Loader } from "@plane/ui";

export const ProjectStateLoader = () => (
  <Loader className="space-y-5 md:w-2/3">
    <Loader.Item height="40px" />
    <Loader.Item height="40px" />
    <Loader.Item height="40px" />
    <Loader.Item height="40px" />
  </Loader>
);
