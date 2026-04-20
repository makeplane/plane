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
// plane imports
import { ContentWrapper } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkspaceAccess } from "@/hooks/permissions/use-workspace-access";
// local imports
import {
  ComparePlaneView,
  GetStartedSection,
  IntegrationsView,
  TeamSection,
  GetStartedGreetingsView,
  BusinessTrialBanner,
} from "./widgets";

export const GetStartedRoot = observer(function GetStartedRoot() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { data: currentUser } = useUser();
  const { hasWorkspaceResourcePermission } = useWorkspaceAccess();
  // derived
  const hasTeamSectionPermission = hasWorkspaceResourcePermission(workspaceSlug, "team_spaces");

  if (!currentUser) {
    return null;
  }

  return (
    <ContentWrapper className="gap-6 bg-surface-2 mx-auto scrollbar-hide px-page-x !py-8">
      <main className="flex flex-col gap-10 max-w-[800px] mx-auto w-full">
        <GetStartedGreetingsView user={currentUser} />
        <div className="flex flex-col gap-12">
          <BusinessTrialBanner />
          <GetStartedSection />
          {hasTeamSectionPermission && <TeamSection workspaceSlug={workspaceSlug} />}
          <IntegrationsView />
          <ComparePlaneView />
        </div>
      </main>
    </ContentWrapper>
  );
});
