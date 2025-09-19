"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { EUserPermissionsLevel } from "@plane/constants";
import { PlaneLockup } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { AlertModalCore, Button } from "@plane/ui";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { PaidPlanUpgradeModal } from "@/plane-web/components/license";
import { ProjectAppSidebar } from "app/(all)/[workspaceSlug]/(projects)/_sidebar";

export const WorkspaceDisabledPage: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  // state
  const [isPaidPlanModalOpen, togglePaidPlanModal] = useState(false);
  const [isDowngradeModalOpen, toggleDowngradeModal] = useState(false);
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { getWorkspaceBySlug } = useWorkspace();
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
      <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
      <div className="relative flex h-full w-full overflow-hidden">
        <ProjectAppSidebar />
        <main className="relative flex h-full w-full flex-col justify-center items-center overflow-hidden bg-custom-background-100">
          <div className="flex flex-col gap-12 items-center justify-center py-6 max-w-lg">
            <PlaneLockup className="h-5 w-auto text-custom-text-100" />
            <div className="flex flex-col gap-2">
              <span className="text-lg font-medium text-custom-text-200 text-center">Your payment needs attention</span>
              <p className="text-sm text-custom-text-300 text-center">
                {`Your payment for ${workspace?.name} couldn't be processed. Update your payment method to keep all your Business features.`}
              </p>
            </div>
            {isWorkspaceAdmin && (
              <div className="flex flex-col items-center justify-center gap-4 max-w-64">
                <Button size="md" className="w-full" onClick={() => togglePaidPlanModal(true)}>
                  Select your plan
                </Button>
                <Button size="md" className="w-full" variant="link-neutral" onClick={() => toggleDowngradeModal(true)}>
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
