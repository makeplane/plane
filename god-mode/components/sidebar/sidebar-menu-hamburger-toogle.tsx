import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useAppTheme } from "hooks/use-theme";
// icons
import { Menu } from "lucide-react";

export const SidebarHamburgerToggle: FC = observer(() => {
  const { toggleSidebar } = useAppTheme();
  return (
    <div
      className="w-7 h-7 rounded flex justify-center items-center bg-custom-background-80 transition-all hover:bg-custom-background-90 cursor-pointer group md:hidden"
      onClick={() => toggleSidebar()}
    >
      <Menu
        size={14}
        className="text-custom-text-200 group-hover:text-custom-text-100 transition-all"
      />
    </div>
  );
});
