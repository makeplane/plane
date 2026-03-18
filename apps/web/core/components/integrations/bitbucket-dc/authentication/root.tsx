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

import { observer } from "mobx-react";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import { ConnectOrganization } from "./connect-organization";
import { ConnectPersonalAccount } from "./connect-personal-account";

export const UserAuthentication = observer(function UserAuthentication() {
  const {
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useBitbucketDCIntegration();

  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;

  return (
    <div className="relative space-y-4">
      <ConnectOrganization />
      {workspaceConnection && <ConnectPersonalAccount />}
    </div>
  );
});
