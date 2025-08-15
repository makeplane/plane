"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { BetaBadge, Button } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// assets
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import PiDark from "@/public/empty-state/pi/chat-dark.webp";
import PiLight from "@/public/empty-state/pi/chat-light.webp";
import PiChatLogo from "@/public/logos/pi.png";

export const EmptyPiChat = observer(() => {
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const { resolvedTheme } = useTheme();

  // derived values
  const canCreateProject = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <div className={cn("h-full bg-pi-50 px-page-x pt-4 ")}>
      <div className="flex justify-between h-8">
        <div className="flex gap-1">
          <Image width={16} height={16} src={PiChatLogo} alt="Pi" className="my-auto" />
          <span className="font-medium text-sm my-auto "> Pi Chat</span>
          <BetaBadge />
        </div>
      </div>
      <div className="flex flex-col flex-1 px-page-x pt-4 pb-8 relative h-full">
        <div className="mx-auto flex h-full flex-col justify-center space-y-4 lg:w-3/5">
          <h4 className="text-xl font-semibold">Upgrade to Pro for unlimited access to Pi Chat</h4>
          <p className="text-custom-text-100">
            Whether you need quick guidance, task updates, or help brainstorming ideas, this intelligent assistant is
            here 24/7 to make managing work easier{" "}
          </p>
          <Image
            src={resolvedTheme?.includes("dark") ? PiDark : PiLight}
            className="w-full max-h-[400px]"
            alt="Project empty state"
          />
          {canCreateProject && (
            <div className="flex justify-center gap-4 self-start md:!-my-[20px]">
              <Button
                size="lg"
                className="py-1 bg-pi-700 h-[40px] hover:bg-pi-700 focus:bg-pi-700"
                onClick={() => togglePaidPlanModal(true)}
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade to Pro
              </Button>
              <a
                href="https://plane.so/pricing"
                target="_blank"
                className={"underline my-auto text-pi-700 font-medium"}
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
