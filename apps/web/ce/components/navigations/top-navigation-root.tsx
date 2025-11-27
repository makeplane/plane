// components
import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { TopNavPowerK } from "@/components/navigation";
import { HelpMenuRoot } from "@/components/workspace/sidebar/help-section/root";
import { UserMenuRoot } from "@/components/workspace/sidebar/user-menu-root";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";

export const TopNavigationRoot = observer(() => {
  const { preferences } = useAppRailPreferences();

  const showLabel = preferences.displayMode === "icon_with_label";

  return (
    <div
      className={cn("flex items-center min-h-11 w-full px-3.5 z-[27] transition-all duration-300", {
        "px-2": !showLabel,
      })}
    >
      {/* Workspace Menu */}
      <div className="shrink-0 flex-1">
        <WorkspaceMenuRoot />
      </div>
      {/* Power K Search */}
      <div className="shrink-0">
        <TopNavPowerK />
      </div>
      {/* Additional Actions */}
      <div className="shrink-0 flex-1 flex gap-1 items-center justify-end">
        <HelpMenuRoot />
        <div className="flex items-center justify-center size-8 hover:bg-custom-background-80 rounded-md">
          <UserMenuRoot size="xs" />
        </div>
      </div>
    </div>
  );
});
