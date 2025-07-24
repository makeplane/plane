import { ReactNode } from "react";
import { AppSidebarToggleButton } from "@/components/sidebar";
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const ExtendedAppHeader = (props: { header: ReactNode }) => {
  const { header } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();

  return (
    <>
      {sidebarCollapsed && <AppSidebarToggleButton />}
      <div className="w-full">{header}</div>
    </>
  );
};
