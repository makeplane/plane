"use client";

import { FC } from "react";
import { Loader } from "@plane/ui";

export const WorkspaceProjectStatesLoader: FC = () => (
  <Loader className="space-y-4">
    <Loader.Item height="47px" width="100%" />
    <Loader.Item height="47px" width="100%" />
    <Loader.Item height="47px" width="100%" />
    <Loader.Item height="47px" width="100%" />
    <Loader.Item height="47px" width="100%" />
  </Loader>
);
