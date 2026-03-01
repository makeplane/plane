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
// plane imports
import { Loader } from "@plane/ui";
// plane web imports
import { CloudEditionBadge, SelfHostedEditionBadge } from "@/components/workspace/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfHosted = subscriptionDetail?.is_self_managed;

  if (!subscriptionDetail)
    return (
      <Loader className="flex h-full">
        <Loader.Item height="30px" width="95%" />
      </Loader>
    );

  return <>{isSelfHosted ? <SelfHostedEditionBadge /> : <CloudEditionBadge />}</>;
});
