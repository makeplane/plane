import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, PRODUCT_TOUR_COMPLETED, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContentWrapper } from "@plane/ui";
// components
import { DashboardWidgets } from "@/components/dashboard";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { IssuePeekOverview } from "@/components/issues";
import { TourRoot } from "@/components/onboarding";
import { UserGreetingsView } from "@/components/user";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import {
  useCommandPalette,
  useUserProfile,
  useEventTracker,
  useDashboard,
  useProject,
  useUser,
  useUserPermissions,
} from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import useSize from "@/hooks/use-window-size";

export const WorkspaceDashboardView = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { captureEvent, setTrackElement } = useEventTracker();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile, updateTourCompleted } = useUserProfile();
  const { homeDashboardId, fetchHomeDashboardWidgets } = useDashboard();
  const { joinedProjectIds, loader } = useProject();
  const { allowPermissions } = useUserPermissions();

  // helper hooks
  const [windowWidth] = useSize();
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/dashboard" });

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

  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

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
          {joinedProjectIds.length > 0 || loader === "init-loader" ? (
            <>
              <IssuePeekOverview />
              <ContentWrapper
                className={cn("gap-7 bg-custom-background-90/20", {
                  "vertical-scrollbar scrollbar-lg": windowWidth >= 768,
                })}
              >
                {currentUser && <UserGreetingsView user={currentUser} />}

                <DashboardWidgets />
              </ContentWrapper>
            </>
          ) : (
            <DetailedEmptyState
              title={t("workspace_dashboard.empty_state.general.title")}
              description={t("workspace_dashboard.empty_state.general.description")}
              assetPath={resolvedPath}
              customPrimaryButton={
                <ComicBoxButton
                  label={t("workspace_dashboard.empty_state.general.primary_button.text")}
                  title={t("workspace_dashboard.empty_state.general.primary_button.comic.title")}
                  description={t("workspace_dashboard.empty_state.general.primary_button.comic.description")}
                  onClick={() => {
                    setTrackElement("Dashboard empty state");
                    toggleCreateProjectModal(true);
                  }}
                  disabled={!canPerformEmptyStateActions}
                />
              }
            />
          )}
        </>
      )}
    </>
  );
});
