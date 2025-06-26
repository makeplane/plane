"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ConnectOrganization, ConnectPersonalAccount } from "@/plane-web/components/integrations/github";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";

export const UserAuthentication: FC = observer(() => {
  // hooks
  const {
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGithubIntegration();

  // derived values
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;

  return (
    <div className="relative space-y-4">
      <ConnectOrganization />
      {workspaceConnection && <ConnectPersonalAccount />}
    </div>
  );
});
