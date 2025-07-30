"use client";

import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
import { useAppTheme } from "@/hooks/store";

export const SidebarHamburgerToggle = observer(() => {
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
      className="group flex-shrink-0 size-7 grid place-items-center rounded hover:bg-custom-background-80 transition-all bg-custom-background-90"
      onClick={handleClick}
    >
      <PanelRight className="size-3.5 text-custom-text-200 transition-all group-hover:text-custom-text-100" />
    </button>
  );
});
