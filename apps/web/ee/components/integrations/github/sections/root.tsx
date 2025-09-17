"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ProjectPRStateMappingRoot } from "./pr-state-mapping";
import { ProjectIssueSyncRoot } from "./project-issue-sync";

interface IIntegrationRootProps {
  isEnterprise: boolean;
}

export const IntegrationRoot: FC<IIntegrationRootProps> = observer(({ isEnterprise }) => (
  <div className="relative space-y-4">
    <ProjectPRStateMappingRoot isEnterprise={isEnterprise} />
    <ProjectIssueSyncRoot isEnterprise={isEnterprise} />
  </div>
));
