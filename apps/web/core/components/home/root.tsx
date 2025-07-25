import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { PRODUCT_TOUR_TRACKER_EVENTS } from "@plane/constants";
import { ContentWrapper } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { TourRoot } from "@/components/onboarding";
// helpers
import { captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useUserProfile, useUser } from "@/hooks/store";
import { useHome } from "@/hooks/store/use-home";
// plane web components
import { HomePeekOverviewsRoot } from "@/plane-web/components/home";
// local imports
import { DashboardWidgets } from "./home-dashboard-widgets";
import { UserGreetingsView } from "./user-greetings";

export const WorkspaceHomeView = observer(() => {
  // store hooks
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile, updateTourCompleted } = useUserProfile();
  const { fetchWidgets } = useHome();

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
        captureSuccess({
          eventName: PRODUCT_TOUR_TRACKER_EVENTS.complete,
          payload: {
            user_id: currentUser?.id,
          },
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
      <>
        <HomePeekOverviewsRoot />
        <ContentWrapper
          className={cn("gap-6 bg-custom-background-100 max-w-[800px] mx-auto scrollbar-hide px-page-x lg:px-0")}
        >
          {currentUser && <UserGreetingsView user={currentUser} />}
          <DashboardWidgets />
        </ContentWrapper>
      </>
    </>
  );
});
