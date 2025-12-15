import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const SidebarHamburgerToggle = observer(function SidebarHamburgerToggle() {
  // store hooks
  const { toggleSidebar } = useAppTheme();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleSidebar();
  };

  return (
    <button
      type="button"
      className="group flex-shrink-0 size-7 grid place-items-center rounded-sm hover:bg-layer-1 transition-all bg-surface-2"
      onClick={handleClick}
    >
      <PanelRight className="size-3.5 text-secondary transition-all group-hover:text-primary" />
    </button>
  );
});
