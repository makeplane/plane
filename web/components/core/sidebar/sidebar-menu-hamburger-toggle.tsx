import { FC } from "react";
import { Menu } from "lucide-react";
import { useApplication } from "hooks/store";
import { observer } from "mobx-react";

type Props = {
  onClick?: () => void;
};

export const SidebarHamburgerToggle: FC<Props> = observer((props) => {
  const { onClick } = props;
  const { theme: themeStore } = useApplication();
  return (
    <div
      className="w-7 h-7 flex-shrink-0 rounded flex justify-center items-center bg-custom-background-80 transition-all hover:bg-custom-background-90 cursor-pointer group md:hidden"
      onClick={() => {
        if (onClick) onClick();
        else themeStore.toggleSidebar();
      }}
    >
      <Menu size={14} className="text-custom-text-200 group-hover:text-custom-text-100 transition-all" />
    </div>
  );
});
