import { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
// ui
import { Search, X } from "lucide-react";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
import { ProjectViewListItem } from "@/components/views";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// helper
import { cn } from "@/helpers/common.helper";
// hooks
import { useApplication, useProjectView } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

export const ProjectViewsList = observer(() => {
  // states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "" ? true : false);

  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  // store hooks
  const {
    commandPalette: { toggleCreateViewModal },
  } = useApplication();
  const { projectViewIds, getViewById, loader } = useProjectView();

  if (loader || !projectViewIds) return <ViewListLoader />;

  // derived values
  const viewsList = projectViewIds.map((viewId) => getViewById(viewId));

  const filteredViewsList = viewsList.filter((v) => v?.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") setSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  return (
    <>
      {viewsList.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <div className="h-[50px] flex-shrink-0 w-full border-b border-custom-border-200 px-6 relative flex items-center gap-4 justify-between">
            <div className="flex items-center">
              <span className="block text-sm font-medium">View name</span>
            </div>
            <div className="h-full flex items-center gap-2">
              <div className="flex items-center">
                {!isSearchOpen && (
                  <button
                    type="button"
                    className="-mr-1 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
                    onClick={() => {
                      setIsSearchOpen(true);
                      inputRef.current?.focus();
                    }}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                )}
                <div
                  className={cn(
                    "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
                    {
                      "w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
                    }
                  )}
                >
                  <Search className="h-3.5 w-3.5" />
                  <input
                    ref={inputRef}
                    className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                  />
                  {isSearchOpen && (
                    <button
                      type="button"
                      className="grid place-items-center"
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <ListLayout>
            {filteredViewsList.length > 0 ? (
              filteredViewsList.map((view) => <ProjectViewListItem key={view.id} view={view} />)
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <EmptyState type={EmptyStateType.PROJECT_VIEW} primaryButtonOnClick={() => toggleCreateViewModal(true)} />
      )}
    </>
  );
});
