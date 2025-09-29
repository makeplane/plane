"use client";

import { FC } from "react";
// plane web components
import { ConnectOrganization } from "@/plane-web/components/integrations/gitlab";
// plane web hooks

interface IUserAuthenticationProps {
  isEnterprise: boolean;
}

export const UserAuthentication: FC<IUserAuthenticationProps> = ({ isEnterprise }) => (
  <div className="relative">
    <ConnectOrganization isEnterprise={isEnterprise} />
  </div>
);
