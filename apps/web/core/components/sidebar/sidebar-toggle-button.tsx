"use client";

import { observer } from "mobx-react";
import { PanelLeft } from "lucide-react";
// hooks
import { useAppTheme } from "@/hooks/store";

export const AppSidebarToggleButton = observer(() => {
  // store hooks
  const { toggleSidebar, sidebarPeek, toggleSidebarPeek } = useAppTheme();

  return (
    <button
      className="flex items-center justify-center size-6 rounded-md text-custom-text-400 hover:text-custom-primary-100 hover:bg-custom-background-90"
      onClick={() => {
        if (sidebarPeek) toggleSidebarPeek(false);
        toggleSidebar();
      }}
    >
      <PanelLeft className="size-4" />
    </button>
  );
});
