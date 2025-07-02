"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { RepositoryMappingRoot } from "@/plane-web/components/integrations/github";

interface IIntegrationRootProps {
  isEnterprise: boolean;
}

export const IntegrationRoot: FC<IIntegrationRootProps> = observer(({ isEnterprise }) => (
  <div className="relative space-y-4">
    <RepositoryMappingRoot isEnterprise={isEnterprise} />
  </div>
));
