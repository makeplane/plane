"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ConnectOrganization, ConnectPersonalAccount } from "@/plane-web/components/integrations/github";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";

interface IUserAuthenticationProps {
  isEnterprise: boolean;
}

export const UserAuthentication: FC<IUserAuthenticationProps> = observer(({ isEnterprise }) => {
  // hooks
  const {
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGithubIntegration(isEnterprise);

  // derived values
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;

  return (
    <div className="relative space-y-4">
      <ConnectOrganization isEnterprise={isEnterprise} />
      {workspaceConnection && <ConnectPersonalAccount isEnterprise={isEnterprise} />}
    </div>
  );
});
