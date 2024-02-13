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
import { Input } from "@plane/ui";
import { ViewListLoader } from "components/ui";
// constants
import { EUserProjectRoles } from "constants/project";
import { VIEW_EMPTY_STATE_DETAILS } from "constants/empty-state";

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

  if (loader || !projectViewIds) return <ViewListLoader />;

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
          title={VIEW_EMPTY_STATE_DETAILS["project-views"].title}
          description={VIEW_EMPTY_STATE_DETAILS["project-views"].description}
          image={EmptyStateImagePath}
          comicBox={{
            title: VIEW_EMPTY_STATE_DETAILS["project-views"].comicBox.title,
            description: VIEW_EMPTY_STATE_DETAILS["project-views"].comicBox.description,
          }}
          primaryButton={{
            text: VIEW_EMPTY_STATE_DETAILS["project-views"].primaryButton.text,
            onClick: () => toggleCreateViewModal(true),
          }}
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
    </>
  );
});
