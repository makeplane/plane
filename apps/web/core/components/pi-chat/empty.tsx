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
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// assets
import PiDark from "@/app/assets/empty-state/pi/chat-dark.webp?url";
import PiLight from "@/app/assets/empty-state/pi/chat-light.webp?url";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { BetaBadge } from "@/components/common/beta";
import { PiIcon } from "@plane/propel/icons";

export const EmptyPiChat = observer(function EmptyPiChat() {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const { resolvedTheme } = useTheme();

  // derived values
  const canCreateProject = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <div className={cn("h-full bg-surface-2 px-page-x pt-4 ")}>
      <div className="flex justify-between h-8">
        <div className="flex gap-1">
          <PiIcon className="size-4 text-icon-primary fill-current m-auto align-center" />
          <span className="font-medium text-13 my-auto text-primary"> Plane AI</span>
          <BetaBadge />
        </div>
      </div>
      <div className="flex flex-col flex-1 px-page-x pt-4 pb-8 relative h-full">
        <div className="mx-auto flex h-full flex-col justify-center space-y-4 lg:w-3/5">
          <h4 className="text-18 font-semibold text-primary">Upgrade to Pro for unlimited access to Plane AI</h4>
          <p className="text-tertiary">
            Whether you need quick guidance, task updates, or help brainstorming ideas, this intelligent assistant is
            here 24/7 to make managing work easier{" "}
          </p>
          <img
            src={resolvedTheme?.includes("dark") ? PiDark : PiLight}
            className="w-full max-h-[400px]"
            alt="Project empty state"
          />
          {canCreateProject && (
            <div className="flex justify-center gap-4 self-start md:!-my-[20px]">
              <Button
                size="xl"
                className="py-1 bg-primary h-[40px] hover:bg-primary focus:bg-primary"
                onClick={() => togglePaidPlanModal(true)}
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade to Pro
              </Button>
              <a
                href="https://plane.so/pricing"
                target="_blank"
                className={"underline my-auto text-pi-700 font-medium"}
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
