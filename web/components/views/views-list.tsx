import { observer } from "mobx-react-lite";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { ViewListLoader } from "@/components/ui";
import { ProjectViewListItem } from "@/components/views";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { E_VIEWS_EMPTY_STATE } from "@/constants/event-tracker";
// hooks
import { useCommandPalette, useProjectView, useEventTracker } from "@/hooks/store";

export const ProjectViewsList = observer(() => {
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { projectViewIds, getViewById, loader, searchQuery } = useProjectView();
  const { setTrackElement } = useEventTracker();

  if (loader || !projectViewIds) return <ViewListLoader />;

  // derived values
  const viewsList = projectViewIds.map((viewId) => getViewById(viewId));

  const filteredViewsList = viewsList.filter((v) => v?.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {viewsList.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredViewsList.length > 0 ? (
              filteredViewsList.map((view) => <ProjectViewListItem key={view.id} view={view} />)
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <EmptyState
          type={EmptyStateType.PROJECT_VIEW}
          primaryButtonOnClick={() => {
            setTrackElement(E_VIEWS_EMPTY_STATE);
            toggleCreateViewModal(true);
          }}
        />
      )}
    </>
  );
});
