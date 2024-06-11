"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Menu } from "lucide-react";
import { useAppTheme } from "@/hooks/store";

export const SidebarHamburgerToggle: FC = observer(() => {
  // store hooks
  const { toggleSidebar } = useAppTheme();

  return (
    <div
      className="group flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded bg-custom-background-80 transition-all hover:bg-custom-background-90 md:hidden"
      onClick={() => toggleSidebar()}
    >
      <Menu size={14} className="text-custom-text-200 transition-all group-hover:text-custom-text-100" />
    </div>
  );
});
