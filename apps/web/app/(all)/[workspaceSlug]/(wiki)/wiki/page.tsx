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

import { useParams } from "next/navigation";
import { ContentWrapper } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";
import { PageHead } from "@/components/core/page-title";
import { RecentActivityWidget } from "@/components/home/widgets/recents/index";
import { StickiesWidget } from "@/components/stickies/widget";
import { UserGreetingsView } from "@/components/user";
// hooks
import { useUser } from "@/hooks/store/user/user-user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import type { Route } from "./+types/page";
import { PagesAppDashboardHeader } from "./header";

export default function WorkspacePagesPage({ params }: Route.ComponentProps) {
  // navigation
  const { workspaceSlug } = params;
  // store hooks
  const { data: currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Wiki` : undefined;

  return (
    <>
      <AppHeader header={<PagesAppDashboardHeader />} />
      <ContentWrapper className={cn("gap-6 bg-surface-1 max-w-[800px] mx-auto scrollbar-hide px-page-x lg:px-0")}>
        <PageHead title={pageTitle} />
        {currentUser && <UserGreetingsView user={currentUser} />}
        <div className="size-full divide-y-[1px] divide-subtle">
          <div className="py-4">
            <RecentActivityWidget
              workspaceSlug={workspaceSlug}
              presetFilter="workspace_page"
              showFilterSelect={false}
            />
          </div>
          <div className="py-4">
            <StickiesWidget />
          </div>
        </div>
      </ContentWrapper>
    </>
  );
}
