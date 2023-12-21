import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Plus, Search } from "lucide-react";
// hooks
import { useApplication, useProjectView, useUser } from "hooks/store";
// components
import { ProjectViewListItem } from "components/views";
import { NewEmptyState } from "components/common/new-empty-state";
// ui
import { Input, Loader } from "@plane/ui";
// assets
import emptyView from "public/empty-state/empty_view.webp";
// constants
import { EUserProjectRoles } from "constants/project";

export const ProjectViewsList = observer(() => {
  // states
  const [query, setQuery] = useState("");
  // store hooks
  const {
    commandPalette: { toggleCreateViewModal },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { projectViewIds, getViewById } = useProjectView();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  if (!projectViewIds)
    return (
      <Loader className="space-y-4 p-4">
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
        <Loader.Item height="72px" />
      </Loader>
    );

  const viewsList = projectViewIds.map((viewId) => getViewById(viewId));

  const filteredViewsList = viewsList.filter((v) => v?.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {viewsList.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <div className="flex w-full flex-col overflow-hidden">
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
          {filteredViewsList.length > 0 ? (
            filteredViewsList.map((view) => <ProjectViewListItem key={view.id} view={view} />)
          ) : (
            <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
          )}
        </div>
      ) : (
        <NewEmptyState
          title="Save filtered views for your project. Create as many as you need."
          description="Views are a set of saved filters that you use frequently or want easy access to. All your colleagues in a project can see everyone’s views and choose whichever suits their needs best."
          image={emptyView}
          comicBox={{
            title: "Views work atop Issue properties.",
            description: "You can create a view from here with as many properties as filters as you see fit.",
            direction: "right",
          }}
          primaryButton={{
            icon: <Plus size={14} strokeWidth={2} />,
            text: "Build your first view",
            onClick: () => toggleCreateViewModal(true),
          }}
          disabled={!isEditingAllowed}
        />
      )}
    </>
  );
});
