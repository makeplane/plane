"use client";

import { useState } from "react";
import { AppSidebar } from "app/[workspaceSlug]/(projects)/sidebar";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { CircleAlert } from "lucide-react";
// hooks
import { Button, getButtonStyling } from "@plane/ui";
import { useUserPermissions } from "@/hooks/store";
// plane web components
import { PaidPlanUpgradeModal } from "@/plane-web/components/license";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";
// assets
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";

export const WorkspaceDisabledPage: React.FC = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  // state
  const [isPaidPlanModalOpen, togglePaidPlanModal] = useState(false);
  // hooks
  const { resolvedTheme } = useTheme();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);

  return (
    <>
      <PaidPlanUpgradeModal isOpen={isPaidPlanModalOpen} handleClose={() => togglePaidPlanModal(false)} />
      <div className="relative flex h-full w-full overflow-hidden">
        <AppSidebar />
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
                  {isWorkspaceAdmin ? "Your payment has failed!" : "Something’s not okay"}
                </p>
                <p className="text-custom-text-300">
                  {isWorkspaceAdmin
                    ? "We tried to bill your account but the payment method is facing issues. Please fix the issue to resume service."
                    : "Your workspace is facing some issues. Please contact your admin."}
                </p>
              </div>
              {isWorkspaceAdmin && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <Link href={`/${workspaceSlug}/settings/members`} className={getButtonStyling("link-neutral", "md")}>
                    Remove members
                  </Link>
                  <Button size="md" onClick={() => togglePaidPlanModal(true)}>
                    Upgrade plan
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
