import { observer } from "mobx-react";
import { FilePlus2 } from "lucide-react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { AppSearch } from "../../workspace/sidebar/app-search";
// plane web components

export const PagesAppSidebarQuickActions = observer(() => {
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();

  return (
    <div className="flex items-center justify-between gap-1 cursor-pointer">
      <button
        type="button"
        className="flex-grow text-custom-text-300 text-sm font-medium border-[0.5px] border-custom-sidebar-border-300 text-left rounded h-8 hover:bg-custom-sidebar-background-90 px-3 flex items-center gap-2"
        onClick={() =>
          toggleCreatePageModal({
            isOpen: true,
          })
        }
      >
        <FilePlus2 className="size-4" />
        New page
      </button>
      <AppSearch />
    </div>
  );
});
