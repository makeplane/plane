/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { ConnectOrganization, ConnectPersonalAccount } from "@/components/integrations/github";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";

interface IUserAuthenticationProps {
  isEnterprise: boolean;
}

export const UserAuthentication = observer(function UserAuthentication({ isEnterprise }: IUserAuthenticationProps) {
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
