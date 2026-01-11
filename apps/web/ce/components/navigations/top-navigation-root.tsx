// components
import { TopNavPowerK } from "@/components/navigation";
import { HelpMenuRoot } from "@/components/workspace/sidebar/help-section/root";
import { UserMenuRoot } from "@/components/workspace/sidebar/user-menu-root";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";
import { cn } from "@plane/utils";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// local imports
import { StarUsOnGitHubLink } from "@/app/(all)/[workspaceSlug]/(projects)/star-us-link";
import { NotificationsPopoverRoot } from "@/components/notifications/popover/root";

export const TopNavigationRoot = observer(function TopNavigationRoot() {
  // router
  const { workspaceSlug } = useParams();

  // store hooks
  const { preferences } = useAppRailPreferences();
  const showLabel = preferences.displayMode === "icon_with_label";

  return (
    <div
      className={cn("flex items-center min-h-10 w-full px-3.5 bg-canvas z-[27] transition-all duration-300", {
        "px-2": !showLabel,
      })}
    >
      {/* Workspace Menu */}
      <div className="shrink-0 flex-1">
        <WorkspaceMenuRoot variant="top-navigation" />
      </div>
      {/* Power K Search */}
      <div className="shrink-0">
        <TopNavPowerK />
      </div>
      {/* Additional Actions */}
      <div className="shrink-0 flex-1 flex gap-1 items-center justify-end">
        <NotificationsPopoverRoot workspaceSlug={workspaceSlug?.toString()} />
        <HelpMenuRoot />
        <StarUsOnGitHubLink />
        <div className="flex items-center justify-center size-8 hover:bg-layer-1-hover rounded-md">
          <UserMenuRoot size="xs" />
        </div>
      </div>
    </div>
  );
});
