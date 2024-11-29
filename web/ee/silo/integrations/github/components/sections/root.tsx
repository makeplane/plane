"use client";

import { FC } from "react";
// components
import { UserMappingRoot, RepositoryMappingRoot } from "@/plane-web/silo/integrations/github/components";

export const IntegrationRoot: FC = (props) => {
  const {} = props;

  return (
    <div className="relative space-y-4">
      <UserMappingRoot />
      <RepositoryMappingRoot />
    </div>
  );
};
