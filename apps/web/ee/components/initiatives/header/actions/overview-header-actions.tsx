import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store";

export const InitiativeOverviewHeaderActions = observer(() => {
  const { initiativesSidebarCollapsed, toggleInitiativesSidebar } = useAppTheme();
  return (
    <button
      type="button"
      className="p-1 rounded outline-none hover:bg-custom-sidebar-background-80 bg-custom-background-80/70"
      onClick={() => toggleInitiativesSidebar()}
    >
      <PanelRight
        className={cn("size-4 cursor-pointer", {
          "text-custom-primary-100": !initiativesSidebarCollapsed,
        })}
      />
    </button>
  );
});
