import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
import { ProjectViewListItem } from "@/components/views";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useProjectView } from "@/hooks/store";
// assets

export const ProjectViewsList = observer(() => {
  const { projectId } = useParams();
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { getProjectViews, getFilteredProjectViews, loader } = useProjectView();

  const projectViews = getProjectViews(projectId?.toString());
  const filteredProjectViews = getFilteredProjectViews(projectId?.toString());

  if (loader || !projectViews || !filteredProjectViews) return <ViewListLoader />;

  if (filteredProjectViews.length === 0 && projectViews.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState type={EmptyStateType.VIEWS_EMPTY_SEARCH} layout="screen-simple" />
      </div>
    );
  }

  return (
    <>
      {filteredProjectViews.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredProjectViews.length > 0 ? (
              filteredProjectViews.map((view) => <ProjectViewListItem key={view.id} view={view} />)
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
