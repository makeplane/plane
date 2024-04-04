import { useEffect } from "react";
import { observer } from "mobx-react";
// ui
import { Spinner } from "@plane/ui";
// components
import { DashboardWidgets } from "@/components/dashboard";
import { EmptyState } from "@/components/empty-state";
import { IssuePeekOverview } from "@/components/issues";
import { TourRoot } from "@/components/onboarding";
import { UserGreetingsView } from "@/components/user";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useAppRouter, useCommandPalette, useDashboard, useEventTracker, useProject, useUser } from "@/hooks/store";

export const WorkspaceDashboardView = observer(() => {
  // store hooks
  const {
    //  captureEvent,
    setTrackElement,
  } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { workspaceSlug } = useAppRouter();
  const { data: currentUser } = useUser();
  // const { currentUser, updateTourCompleted } = useUser();
  const { homeDashboardId, fetchHomeDashboardWidgets } = useDashboard();
  const { joinedProjectIds } = useProject();

  const handleTourCompleted = () => {
    // updateTourCompleted()
    //   .then(() => {
    //     captureEvent(PRODUCT_TOUR_COMPLETED, {
    //       user_id: currentUser?.id,
    //       state: "SUCCESS",
    //     });
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
  };

  // fetch home dashboard widgets on workspace change
  useEffect(() => {
    if (!workspaceSlug) return;

    fetchHomeDashboardWidgets(workspaceSlug);
  }, [fetchHomeDashboardWidgets, workspaceSlug]);

  return (
    <>
      {currentUser && !currentUser.is_tour_completed && (
        <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      {homeDashboardId && joinedProjectIds ? (
        <>
          {joinedProjectIds.length > 0 ? (
            <>
              <IssuePeekOverview />
              <div className="vertical-scrollbar scrollbar-lg flex h-full w-full flex-col space-y-7 overflow-y-auto bg-custom-background-90 p-7">
                {currentUser && <UserGreetingsView user={currentUser} />}

                <DashboardWidgets />
              </div>
            </>
          ) : (
            <EmptyState
              type={EmptyStateType.WORKSPACE_DASHBOARD}
              primaryButtonOnClick={() => {
                setTrackElement("Dashboard empty state");
                toggleCreateProjectModal(true);
              }}
            />
          )}
        </>
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Spinner />
        </div>
      )}
    </>
  );
});
