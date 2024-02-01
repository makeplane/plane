import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Search } from "lucide-react";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useProjectView, useUser } from "hooks/store";
// components
import { ProjectViewListItem } from "components/views";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Input, Loader, Spinner } from "@plane/ui";
// constants
import { EUserProjectRoles } from "constants/project";

export const ProjectViewsList = observer(() => {
  // states
  const [query, setQuery] = useState("");
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    commandPalette: { toggleCreateViewModal },
  } = useApplication();
  const {
    membership: { currentProjectRole },
    currentUser,
  } = useUser();
  const { projectViewIds, getViewById, loader } = useProjectView();

  if (loader)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );

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

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "views", isLightMode);

  const filteredViewsList = viewsList.filter((v) => v?.name.toLowerCase().includes(query.toLowerCase()));

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
        <EmptyState
          title="Save filtered views for your project. Create as many as you need"
          description="Views are a set of saved filters that you use frequently or want easy access to. All your colleagues in a project can see everyone’s views and choose whichever suits their needs best."
          image={EmptyStateImagePath}
          comicBox={{
            title: "Views work atop Issue properties.",
            description: "You can create a view from here with as many properties as filters as you see fit.",
          }}
          primaryButton={{
            text: "Create your first view",
            onClick: () => toggleCreateViewModal(true),
          }}
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
    </>
  );
});
