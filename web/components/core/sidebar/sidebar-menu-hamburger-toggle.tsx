import { FC } from "react";
import { Menu } from "lucide-react";
import { useApplication } from "hooks/store";
import { observer } from "mobx-react";

export const SidebarHamburgerToggle: FC = observer (() => {
  const { theme: themStore } = useApplication();
  return (
    <div
      className="w-7 h-7 rounded flex justify-center items-center bg-custom-background-80 transition-all hover:bg-custom-background-90 cursor-pointer group md:hidden"
      onClick={() => themStore.toggleSidebar()}
    >
      <Menu size={14} className="text-custom-text-200 group-hover:text-custom-text-100 transition-all" />
    </div>
  );
});
