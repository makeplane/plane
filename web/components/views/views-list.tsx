import { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectViewListItem } from "components/views";
import { EmptyState } from "components/common";
// ui
import { Input, Loader } from "components/ui";
// assets
import emptyView from "public/empty-state/view.svg";
// icons
import { Plus, Search } from "lucide-react";

export const ProjectViewsList = observer(() => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { projectId } = router.query;

  const { projectViews: projectViewsStore } = useMobxStore();

  const viewsList = projectId ? projectViewsStore.viewsList[projectId.toString()] : undefined;

  if (!viewsList)
    return (
      <Loader className="space-y-4 p-4">
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
      </Loader>
    );

  const filteredViewsList = viewsList.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {viewsList.length > 0 ? (
        <div className="h-full w-full flex flex-col">
          <div className="w-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-2.5 w-full px-5 py-3 border-b border-custom-border-200">
              <Search className="text-custom-text-200" size={14} strokeWidth={2} />
              <Input
                className="w-full bg-transparent text-xs leading-5 text-custom-text-200 placeholder:text-custom-text-400 !p-0 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                mode="trueTransparent"
              />
            </div>
          </div>
          {filteredViewsList.length > 0 ? (
            filteredViewsList.map((view) => <ProjectViewListItem key={view.id} view={view} />)
          ) : (
            <p className="text-custom-text-300 text-sm text-center mt-10">No results found</p>
          )}
        </div>
      ) : (
        <EmptyState
          title="Get focused with views"
          description="Views aid in saving your issues by applying various filters and grouping options."
          image={emptyView}
          primaryButton={{
            icon: <Plus size={14} strokeWidth={2} />,
            text: "New View",
            onClick: () => {
              const e = new KeyboardEvent("keydown", {
                key: "v",
              });
              document.dispatchEvent(e);
            },
          }}
        />
      )}
    </>
  );
});
