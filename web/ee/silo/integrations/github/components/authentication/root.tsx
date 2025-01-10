"use client";

import { FC } from "react";
// components
import { ConnectOrganization, ConnectPersonalAccount } from "@/plane-web/silo/integrations/github/components";

export const UserAuthentication: FC = (props) => {
  const {} = props;

  return (
    <div className="relative space-y-4">
      <ConnectOrganization />
      <ConnectPersonalAccount />
    </div>
  );
};
