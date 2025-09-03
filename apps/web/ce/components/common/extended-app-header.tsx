import { observer } from "mobx-react";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const ExtendedAppHeader = observer((props: { header: React.ReactNode }) => {
  const { header } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();

  return (
    <>
      {sidebarCollapsed && <AppSidebarToggleButton />}
      <div className="w-full">{header}</div>
    </>
  );
});
