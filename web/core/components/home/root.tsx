import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import useSWR from "swr";
import { PRODUCT_TOUR_COMPLETED } from "@plane/constants";
import { ContentWrapper } from "@plane/ui";
import { TourRoot } from "@/components/onboarding";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useUserProfile, useEventTracker, useUser } from "@/hooks/store";
import { useHome } from "@/hooks/store/use-home";
import useSize from "@/hooks/use-window-size";
import { IssuePeekOverview } from "../issues";
import { DashboardWidgets } from "./home-dashboard-widgets";
import { UserGreetingsView } from "./user-greetings";

export const WorkspaceHomeView = observer(() => {
  // store hooks
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile, updateTourCompleted } = useUserProfile();
  const { captureEvent } = useEventTracker();
  const { toggleWidgetSettings, fetchWidgets } = useHome();
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
      <>
        <IssuePeekOverview />
        <ContentWrapper
          className={cn("gap-6 bg-custom-background-90/20", {
            "vertical-scrollbar scrollbar-lg": windowWidth >= 768,
          })}
        >
          {currentUser && <UserGreetingsView user={currentUser} handleWidgetModal={() => toggleWidgetSettings(true)} />}
          <DashboardWidgets />
        </ContentWrapper>
      </>
    </>
  );
});
