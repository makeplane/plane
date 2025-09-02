import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import { PiIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { isPiAllowed } from "@/plane-web/helpers/pi-chat.helper";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { isSidebarToggleVisible } from "../desktop/helper";

export const ExtendedAppHeader = observer((props: { header: ReactNode }) => {
  const { header } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { togglePiChatDrawer, isPiChatDrawerOpen } = usePiChat();
  const { sidebarCollapsed } = useAppTheme();
  const shouldRenderPiChat =
    useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.PI_CHAT) &&
    isPiAllowed(pathname.replace(`/${workspaceSlug}`, "")) &&
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);

  return (
    <>
      {isSidebarToggleVisible() && sidebarCollapsed && <AppSidebarToggleButton />}
      <div className="flex items-center gap-2 divide-x divide-custom-border-100 w-full">
        <div className="w-full flex-1">{header}</div>
        {shouldRenderPiChat && (
          <div className="pl-2">
            <Tooltip tooltipContent="Ask Pi" position="bottom">
              <button
                className={cn(
                  "transition-colors p-2 rounded bg-custom-sidebar-background-80  hover:bg-custom-primary-100/10 hover:text-custom-primary-200  text-custom-text-350 grid place-items-center w-full",
                  {
                    "bg-custom-primary-100/10 !text-custom-primary-200": isPiChatDrawerOpen,
                  }
                )}
                onClick={() => togglePiChatDrawer()}
              >
                <PiIcon className="size-3.5" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </>
  );
});
