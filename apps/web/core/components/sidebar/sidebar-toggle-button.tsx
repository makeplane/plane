import { observer } from "mobx-react";
import { PanelLeft } from "lucide-react";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { isSidebarToggleVisible } from "@/plane-web/components/desktop";

export const AppSidebarToggleButton = observer(function AppSidebarToggleButton() {
  // store hooks
  const { toggleSidebar, sidebarPeek, toggleSidebarPeek } = useAppTheme();

  if (!isSidebarToggleVisible()) return null;
  return (
    <button
      className="flex items-center justify-center size-6 rounded-md text-secondary hover:text-accent-primary hover:bg-surface-2"
      onClick={() => {
        if (sidebarPeek) toggleSidebarPeek(false);
        toggleSidebar();
      }}
    >
      <PanelLeft className="size-4" />
    </button>
  );
});
