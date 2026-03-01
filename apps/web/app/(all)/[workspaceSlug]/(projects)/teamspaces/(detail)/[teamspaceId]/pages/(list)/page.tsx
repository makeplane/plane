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

import { useSearchParams } from "next/navigation";
// plane imports
import type { TPageNavigationTabs } from "@plane/types";
// components
// plane web imports
import { TeamspacePagesListView } from "@/components/teamspaces/pages/pages-list-view";
import type { Route } from "./+types/page";

const getPageType = (pageType: string | null): TPageNavigationTabs => {
  switch (pageType) {
    case "archived":
      return "archived";
    default:
      return "public";
  }
};

function TeamspacePagesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, teamspaceId } = params;
  const searchParams = useSearchParams();

  // Get current page type (only public/archived for teamspaces)
  const pageType = getPageType(searchParams.get("type"));

  return <TeamspacePagesListView pageType={pageType} teamspaceId={teamspaceId} workspaceSlug={workspaceSlug} />;
}

export default TeamspacePagesPage;
