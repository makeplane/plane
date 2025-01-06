import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import useSWR from "swr";
import { ContentWrapper } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import { TourRoot } from "@/components/onboarding";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { PRODUCT_TOUR_COMPLETED } from "@/constants/event-tracker";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useCommandPalette, useUserProfile, useEventTracker, useProject, useUser } from "@/hooks/store";
import { useHome } from "@/hooks/store/use-home";
import useSize from "@/hooks/use-window-size";
import { IssuePeekOverview } from "../issues";
import { DashboardWidgets } from "./home-dashboard-widgets";
import { UserGreetingsView } from "./user-greetings";

export const WorkspaceHomeView = observer(() => {
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
  const { toggleWidgetSettings, fetchWidgets } = useHome();
  const { joinedProjectIds, loader } = useProject();
  const [windowWidth] = useSize();

  useSWR(
    workspaceSlug ? `HOME_DASHBOARD_WIDGETS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWidgets(workspaceSlug?.toString()) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

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

  // TODO: refactor loader implementation
  return (
    <>
      {currentUserProfile && !currentUserProfile.is_tour_completed && (
        <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      {joinedProjectIds && (
        <>
          {joinedProjectIds.length > 0 || loader ? (
            <>
              <IssuePeekOverview />
              <ContentWrapper
                className={cn("gap-7 bg-custom-background-90/20", {
                  "vertical-scrollbar scrollbar-lg": windowWidth >= 768,
                })}
              >
                {currentUser && (
                  <UserGreetingsView user={currentUser} handleWidgetModal={() => toggleWidgetSettings(true)} />
                )}

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
