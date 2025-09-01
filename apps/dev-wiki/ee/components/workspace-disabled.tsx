"use client";

import { EUserWorkspaceRoles } from "@plane/types";
import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { CircleAlert } from "lucide-react";
// hooks
import { EUserPermissionsLevel } from "@plane/constants";
import { AlertModalCore, Button } from "@plane/ui";
import { useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
// assets
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";

export const WorkspaceDisabledPage: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  // state
  const [isPaidPlanModalOpen, togglePaidPlanModal] = useState(false);
  const [isDowngradeModalOpen, toggleDowngradeModal] = useState(false);
  // hooks
  const { resolvedTheme } = useTheme();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspaceSlug = routerWorkspaceSlug?.toString();
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
      <div className="relative flex h-full w-full overflow-hidden">
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
          <div className="absolute inset-0 z-0">
            <Image
              src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
              className="w-full h-full object-cover"
              alt="Plane background pattern"
            />
          </div>
          <div className="relative z-10 w-full h-full overflow-hidden overflow-y-auto flex flex-col">
            <div className="grow w-full max-w-lg h-full mx-auto flex flex-col items-center justify-center">
              <div className="py-6">
                <CircleAlert className="size-14 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-medium py-2.5">
                  {isWorkspaceAdmin ? "We couldn't collect your last invoiced payment." : "A payment is overdue."}
                </p>
                <p className="text-custom-text-300">
                  {isWorkspaceAdmin
                    ? "You have a payment due for your Pro workspace. Please clear it to continue using Pro features or downgrade to Free."
                    : "Your have a payment due for your Pro workspace. Get in touch with one of your admins to fix this."}
                </p>
              </div>
              {isWorkspaceAdmin && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <Button size="md" onClick={() => togglePaidPlanModal(true)}>
                    Continue subscription
                  </Button>
                  <Button size="md" variant="link-neutral" onClick={() => toggleDowngradeModal(true)}>
                    Downgrade
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
});
