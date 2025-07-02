"use client";

import { FC } from "react";
// plane web components
import { ConnectOrganization } from "@/plane-web/components/integrations/gitlab";
// plane web hooks

export const UserAuthentication: FC = () => (
  <div className="relative">
    <ConnectOrganization />
  </div>
);
