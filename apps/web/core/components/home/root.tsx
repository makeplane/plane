/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ContentWrapper } from "@plane/ui";
import { NavigationTour } from "@/components/tour";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useHome } from "@/hooks/store/use-home";
import { useUserProfile, useUser } from "@/hooks/store/user";
// plane web imports
import { HomePeekOverviewsRoot } from "@/components/home/peek-overviews";
import { TourRoot } from "@/components/onboarding/tour/root";
// local imports
import { DashboardWidgets } from "./home-dashboard-widgets";
import { UserGreetingsView } from "./user-greetings";

export const WorkspaceHomeView = observer(function WorkspaceHomeView() {
  // store hooks
  const { workspaceSlug } = useParams();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile, updateTourCompleted } = useUserProfile();
  const { fetchWidgets } = useHome();
  const { isAnyModalOpen } = useCommandPalette();

  useSWR(
    workspaceSlug ? `HOME_DASHBOARD_WIDGETS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWidgets(workspaceSlug?.toString()) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const handleTourCompleted = async () => {
    await updateTourCompleted();
  };

  const showTour = currentUserProfile && !currentUserProfile.is_tour_completed;

  // TODO: refactor loader implementation
  return (
    <>
      {showTour && (
        <div className="fixed left-0 top-0 z-30 grid h-full w-full place-items-center bg-backdrop transition-opacity overflow-y-auto">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}

      {/* Navigation tour - shows after onboarding is completed */}
      {currentUserProfile?.is_tour_completed &&
        !currentUserProfile?.is_navigation_tour_completed &&
        !isAnyModalOpen && <NavigationTour />}

      <>
        <HomePeekOverviewsRoot />
        <ContentWrapper className="gap-6 bg-surface-1 mx-auto scrollbar-hide px-page-x">
          <div className="max-w-[800px] mx-auto w-full">
            {currentUser && <UserGreetingsView user={currentUser} />}
            <DashboardWidgets />
          </div>
        </ContentWrapper>
      </>
    </>
  );
});
