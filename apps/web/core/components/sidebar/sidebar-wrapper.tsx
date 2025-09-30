import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { SidebarDropdown } from "@/components/workspace/sidebar/dropdown";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useAppRail } from "@/hooks/use-app-rail";
import useSize from "@/hooks/use-window-size";
// plane web components
import { SidebarContentWrapper } from "@/plane-web/components/sidebar";
import { WorkspaceEditionBadge } from "@/plane-web/components/workspace/edition-badge";

type TSidebarWrapperProps = {
  title: string;
  children: React.ReactNode;
  quickActions?: React.ReactNode;
};

export const SidebarWrapper: FC<TSidebarWrapperProps> = observer((props) => {
  const { children, title, quickActions } = props;
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { shouldRenderAppRail, isEnabled: isAppRailEnabled } = useAppRail();
  const windowSize = useSize();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false && window.innerWidth < 768) {
      toggleSidebar();
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768 && !sidebarCollapsed) toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  return (
    <div ref={ref} className="relative flex flex-col h-full w-full">
      <div className="flex flex-col gap-3 px-3">
        {/* Workspace switcher and settings */}
        {!shouldRenderAppRail && <SidebarDropdown />}

        {isAppRailEnabled && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-md text-custom-text-200 font-medium pt-1">{title}</span>
            <div className="flex items-center gap-2">
              <AppSidebarToggleButton />
            </div>
          </div>
        )}
        {/* Quick actions */}
        {quickActions}
      </div>
      <SidebarContentWrapper>{children}</SidebarContentWrapper>
      {/* Help Section */}
      <WorkspaceEditionBadge />
    </div>
  );
});
