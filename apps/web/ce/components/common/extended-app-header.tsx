import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";

export const ExtendedAppHeader = observer(function ExtendedAppHeader(props: { header: ReactNode }) {
  const { header } = props;
  // params
  const { projectId, workItem } = useParams();
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  // derived values
  const shouldShowSidebarToggleButton = projectPreferences.navigationMode === "ACCORDION" || (!projectId && !workItem);

  return (
    <>
      {sidebarCollapsed && shouldShowSidebarToggleButton && <AppSidebarToggleButton />}
      <div className="w-full">{header}</div>
    </>
  );
});
