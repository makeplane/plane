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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { PlaneLockup } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";
import { GlobalModals } from "@/components/common/modal/global";

export const WorkspaceDowngradePage = observer(function WorkspaceDowngradePage() {
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  // state
  const [isDowngradeModalOpen, toggleDowngradeModal] = useState(false);
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { getWorkspaceBySlug } = useWorkspace();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const workspace = getWorkspaceBySlug(workspaceSlug);
  const isWorkspaceAdmin = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );

  const handleRemoveMembers = () => {
    toggleDowngradeModal(false);
    router.push(`/${workspaceSlug}/settings/members`);
  };

  return (
    <>
      <GlobalModals workspaceSlug={workspaceSlug} />
      <AlertModalCore
        variant="danger"
        isOpen={isDowngradeModalOpen}
        title="You've more than 12 users in this workspace."
        primaryButtonText={{
          loading: "Redirecting",
          default: "Remove members",
        }}
        content={<>The Free tier only lets you have 12 users. Remove users to continue using the Free tier. </>}
        handleClose={() => toggleDowngradeModal(false)}
        handleSubmit={handleRemoveMembers}
        isSubmitting={false}
      />
      <div className="relative flex h-full w-full overflow-hidden">
        <main className="relative flex h-full w-full flex-col justify-center items-center overflow-hidden bg-surface-1">
          <div className="flex flex-col gap-12 items-center justify-center py-6 max-w-lg">
            <PlaneLockup className="h-5 w-auto text-primary" />
            <div className="flex flex-col gap-2">
              <span className="text-16 font-medium text-secondary text-center">Your payment needs attention</span>
              <p className="text-13 text-tertiary text-center">
                {`Your payment for ${workspace?.name} couldn't be processed. Update your payment method to keep all your Business features.`}
              </p>
            </div>
            {isWorkspaceAdmin && (
              <div className="flex flex-col items-center justify-center gap-4 max-w-64">
                <Button size="lg" className="w-full" onClick={() => togglePaidPlanModal(true)}>
                  Select your plan
                </Button>
                <Button size="lg" className="w-full" variant="ghost" onClick={() => toggleDowngradeModal(true)}>
                  Downgrade to free plan with 12 users
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
});
