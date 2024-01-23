import { useEffect } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useDashboard, useProject, useUser } from "hooks/store";
// components
import { TourRoot } from "components/onboarding";
import { UserGreetingsView } from "components/user";
import { IssuePeekOverview } from "components/issues";
import { DashboardProjectEmptyState, DashboardWidgets } from "components/dashboard";
// ui
import { Spinner } from "@plane/ui";

export const WorkspaceDashboardView = observer(() => {
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
    router: { workspaceSlug },
  } = useApplication();
  const { currentUser, updateTourCompleted } = useUser();
  const { homeDashboardId, fetchHomeDashboardWidgets } = useDashboard();
  const { joinedProjectIds } = useProject();

  const handleTourCompleted = () => {
    updateTourCompleted()
      .then(() => {
        postHogEventTracker("USER_TOUR_COMPLETE", {
          user_id: currentUser?.id,
          email: currentUser?.email,
          state: "SUCCESS",
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // fetch home dashboard widgets on workspace change
  useEffect(() => {
    if (!workspaceSlug) return;

    fetchHomeDashboardWidgets(workspaceSlug);
  }, [fetchHomeDashboardWidgets, workspaceSlug]);

  return (
    <>
      <IssuePeekOverview />
      {currentUser && !currentUser.is_tour_completed && (
        <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      {homeDashboardId && joinedProjectIds ? (
        <div className="space-y-7 p-7 bg-custom-background-90 h-full w-full flex flex-col overflow-y-auto">
          {currentUser && <UserGreetingsView user={currentUser} />}
          {joinedProjectIds.length > 0 ? <DashboardWidgets /> : <DashboardProjectEmptyState />}
        </div>
      ) : (
        <div className="h-full w-full grid place-items-center">
          <Spinner />
        </div>
      )}
    </>
  );
});
