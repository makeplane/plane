import { observer } from "mobx-react";
import { Search } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette } from "@/hooks/store";

export const AppSearch = observer(() => {
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { toggleCommandPaletteModal } = useCommandPalette();

  return (
    <button
      className={cn(
        "flex-shrink-0 size-8 aspect-square grid place-items-center rounded hover:bg-custom-sidebar-background-90 outline-none",
        {
          "border-[0.5px] border-custom-sidebar-border-300": !sidebarCollapsed,
        }
      )}
      onClick={() => toggleCommandPaletteModal(true)}
    >
      <Search className="size-4 text-custom-sidebar-text-300" />
    </button>
  );
});
