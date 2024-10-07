import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { ContentWrapper } from "@plane/ui";
import { DashboardWidgets } from "@/components/dashboard";
import { EmptyState } from "@/components/empty-state";
import { IssuePeekOverview } from "@/components/issues";
import { TourRoot } from "@/components/onboarding";
import { UserGreetingsView } from "@/components/user";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { PRODUCT_TOUR_COMPLETED } from "@/constants/event-tracker";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useCommandPalette, useUserProfile, useEventTracker, useDashboard, useProject, useUser } from "@/hooks/store";
import useSize from "@/hooks/use-window-size";

export const WorkspaceDashboardView = observer(() => {
  // store hooks
  const {
    //  captureEvent,
    setTrackElement,
  } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile, updateTourCompleted } = useUserProfile();
  const { captureEvent } = useEventTracker();
  const { homeDashboardId, fetchHomeDashboardWidgets } = useDashboard();
  const { joinedProjectIds, loader } = useProject();

  const [windowWidth] = useSize();

  const handleTourCompleted = () => {
    updateTourCompleted()
      .then(() => {
        captureEvent(PRODUCT_TOUR_COMPLETED, {
          user_id: currentUser?.id,
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

    fetchHomeDashboardWidgets(workspaceSlug?.toString());
  }, [fetchHomeDashboardWidgets, workspaceSlug]);

  // TODO: refactor loader implementation
  return (
    <>
      {currentUserProfile && !currentUserProfile.is_tour_completed && (
        <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      {homeDashboardId && joinedProjectIds && (
        <>
          {joinedProjectIds.length > 0 || loader ? (
            <>
              <IssuePeekOverview />
              <ContentWrapper
                className={cn("gap-7 bg-custom-background-90", {
                  "vertical-scrollbar scrollbar-lg": windowWidth >= 768,
                })}
              >
                {currentUser && <UserGreetingsView user={currentUser} />}

                <DashboardWidgets />
              </ContentWrapper>
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
      )}
    </>
  );
});
