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
import { Crown } from "lucide-react";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { MembersPropertyIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// hooks
// assets
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  workspaceSlug: string;
};

export const SharedPagesFallback = observer(function SharedPagesFallback(props: Props) {
  const { workspaceSlug } = props;
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const { permissions: workspacePermissions } = useWorkspace();

  // derived values
  const canUpgrade = workspacePermissions.getCanManageBilling(workspaceSlug);

  return (
    <div className="h-full bg-surface-1">
      <div className="flex items-center justify-center h-full px-page-x">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="w-20 h-20 bg-layer-1 rounded-xl flex items-center justify-center mb-6">
            <MembersPropertyIcon className="w-10 h-10 text-tertiary" />
          </div>

          <h4 className="text-18 font-semibold mb-3">Upgrade for Page Sharing</h4>
          <p className="text-tertiary text-14 mb-6">
            Collaborate seamlessly by sharing pages with your team members. Grant different access levels and work
            together on your documentation and knowledge base.
          </p>

          <div className="flex flex-col items-center space-y-1 text-13 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-secondary">Share pages with your team</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-secondary">Control access levels (view, edit)</span>
            </div>
          </div>

          {canUpgrade && (
            <div className="flex justify-center gap-4 self-center mt-4">
              <Button
                className="bg-accent-primary hover:bg-accent-primary/90 focus:bg-accent-primary/90"
                onClick={() => togglePaidPlanModal(true)}
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade
              </Button>
              <a
                href="https://plane.so/pricing"
                target="_blank"
                className={cn(getButtonStyling("link", "base"), "hover:underline")}
                rel="noreferrer"
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
