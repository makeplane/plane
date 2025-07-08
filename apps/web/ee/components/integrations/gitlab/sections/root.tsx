"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { RepositoryMappingRoot } from "@/plane-web/components/integrations/gitlab";

export const IntegrationRoot: FC = observer(() => (
  <div className="relative">
    <RepositoryMappingRoot />
  </div>
));
