import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Search } from "lucide-react";
// hooks
// components
import { Input } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
import { ProjectViewListItem } from "@/components/views";
// ui
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { useApplication, useProjectView } from "@/hooks/store";

export const ProjectViewsList = observer(() => {
  // states
  const [query, setQuery] = useState("");
  // store hooks
  const {
    commandPalette: { toggleCreateViewModal },
  } = useApplication();
  const { projectViewIds, getViewById, loader } = useProjectView();

  if (loader || !projectViewIds) return <ViewListLoader />;

  const viewsList = projectViewIds.map((viewId) => getViewById(viewId));

  const filteredViewsList = viewsList.filter((v) => v?.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {viewsList.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <div className="flex w-full flex-col flex-shrink-0 overflow-hidden">
            <div className="flex w-full items-center gap-2.5 border-b border-custom-border-200 px-5 py-3">
              <Search className="text-custom-text-200" size={14} strokeWidth={2} />
              <Input
                className="w-full bg-transparent !p-0 text-xs leading-5 text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                mode="true-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col h-full w-full vertical-scrollbar scrollbar-lg">
            {filteredViewsList.length > 0 ? (
              filteredViewsList.map((view) => <ProjectViewListItem key={view.id} view={view} />)
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </div>
        </div>
      ) : (
        <EmptyState type={EmptyStateType.PROJECT_VIEW} primaryButtonOnClick={() => toggleCreateViewModal(true)} />
      )}
    </>
  );
});
