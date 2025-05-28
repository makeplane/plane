import { observer } from "mobx-react";
import { FilePlus2 } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette } from "@/hooks/store";
// plane web components
import { AppSearch } from "@/plane-web/components/workspace/sidebar";

export const PagesAppSidebarQuickActions = observer(() => {
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { toggleCreatePageModal } = useCommandPalette();
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
      <AppSearch />
    </div>
  );
});
