"use client";

import { observer } from "mobx-react";
import { Users, Crown } from "lucide-react";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store";
// assets
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const SharedPagesFallback = observer(() => {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { togglePaidPlanModal } = useWorkspaceSubscription();

  // derived values
  const canUpgrade = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <div className="h-full bg-custom-background-100">
      <div className="flex items-center justify-center h-full px-page-x">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="w-20 h-20 bg-custom-background-80 rounded-xl flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-custom-text-300" />
          </div>

          <h4 className="text-xl font-semibold mb-3">Upgrade for Page Sharing</h4>
          <p className="text-custom-text-300 text-base mb-6">
            Collaborate seamlessly by sharing pages with your team members. Grant different access levels and work
            together on your documentation and knowledge base.
          </p>

          <div className="flex flex-col items-center space-y-1 text-sm mb-4">
            <div className="flex items-center gap-3">
              <span className="text-custom-text-200">Share pages with your team</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-custom-text-200">Control access levels (view, edit)</span>
            </div>
          </div>

          {canUpgrade && (
            <div className="flex justify-center gap-4 self-center mt-4">
              <Button
                size="sm"
                className="bg-custom-primary hover:bg-custom-primary/90 focus:bg-custom-primary/90"
                onClick={() => togglePaidPlanModal(true)}
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade
              </Button>
              <a
                href="https://plane.so/pricing"
                target="_blank"
                className={cn(getButtonStyling("link-primary", "sm"), "hover:underline")}
              >
                Talk custom pricing
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
