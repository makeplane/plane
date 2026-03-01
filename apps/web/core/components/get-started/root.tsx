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
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { ContentWrapper } from "@plane/ui";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { ComparePlaneView, GetStartedSection, IntegrationsView, TeamSection, GetStartedGreetingsView } from "./widgets";

export const GetStartedRoot = observer(function GetStartedRoot() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();

  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!currentUser) {
    return null;
  }

  return (
    <ContentWrapper className="gap-6 bg-surface-2 mx-auto scrollbar-hide px-page-x !py-8">
      <main className="flex flex-col gap-10 max-w-[800px] mx-auto w-full">
        <GetStartedGreetingsView user={currentUser} />
        <div className="flex flex-col gap-12">
          <GetStartedSection />
          {isWorkspaceAdmin && <TeamSection workspaceSlug={workspaceSlug} />}
          <IntegrationsView />
          <ComparePlaneView />
        </div>
      </main>
    </ContentWrapper>
  );
});
