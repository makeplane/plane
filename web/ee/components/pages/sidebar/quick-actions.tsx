import { observer } from "mobx-react";
import { FilePlus2, Search } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette } from "@/hooks/store";

export const PagesAppSidebarQuickActions = observer(() => {
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { toggleCommandPaletteModal, toggleCreatePageModal } = useCommandPalette();
  // derived values
  const isSidebarCollapsed = !!sidebarCollapsed;

  return (
    <div
      className={cn("flex items-center gap-1 h-10", {
        "h-auto flex-col gap-0": isSidebarCollapsed,
      })}
    >
      <button
        type="button"
        className={cn(
          "flex-grow text-custom-text-300 text-sm font-medium border-[0.5px] border-custom-sidebar-border-300 text-left rounded h-8 hover:bg-custom-sidebar-background-90 px-3 flex items-center gap-2",
          {
            "flex-shrink-0 p-0 size-8 grid place-items-center border-none": isSidebarCollapsed,
          }
        )}
        onClick={() =>
          toggleCreatePageModal({
            isOpen: true,
          })
        }
      >
        <FilePlus2 className="size-4" />
        {!isSidebarCollapsed && "New page"}
      </button>
      <button
        type="button"
        className={cn(
          "flex-shrink-0 grid place-items-center h-8 aspect-square border-[0.5px] border-custom-sidebar-border-300 rounded hover:bg-custom-sidebar-background-90",
          {
            "size-8 border-none": isSidebarCollapsed,
          }
        )}
        onClick={() => toggleCommandPaletteModal(true)}
      >
        <Search className="size-4 text-custom-text-300" />
      </button>
    </div>
  );
});
