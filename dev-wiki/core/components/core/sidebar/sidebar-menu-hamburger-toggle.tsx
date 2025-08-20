"use client";

import { observer } from "mobx-react";
import { Menu } from "lucide-react";
import { useAppTheme } from "@/hooks/store";

export const SidebarHamburgerToggle = observer(() => {
  // store hooks
  const { toggleSidebar } = useAppTheme();

  return (
    <button
      type="button"
      className="group flex-shrink-0 size-7 grid place-items-center rounded bg-custom-background-80 transition-all hover:bg-custom-background-90 md:hidden"
      onClick={() => toggleSidebar()}
    >
      <Menu className="size-3.5 text-custom-text-200 transition-all group-hover:text-custom-text-100" />
    </button>
  );
});
