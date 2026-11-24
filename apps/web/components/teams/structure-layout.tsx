/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet, useParams } from "react-router";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { TeamStructureHeader } from "./structure-header";

/** Layout of the team and portfolio pages. Guests do not see teams. */
export const TeamStructureLayout = observer(function TeamStructureLayout() {
  const { workspaceSlug } = useParams();
  const { fetchStructure } = useTeam();
  const { allowPermissions } = useUserPermissions();
  const isAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  // also loads while the flag is off, so admins can prepare the structure
  const { isLoading } = useSWR(workspaceSlug && isAllowed ? `TEAM_STRUCTURE_PAGE_${workspaceSlug}` : null, () =>
    fetchStructure(workspaceSlug ?? "")
  );

  if (!isAllowed) return <NotAuthorizedView />;

  return (
    <>
      <AppHeader header={<TeamStructureHeader />} />
      <ContentWrapper>
        {isLoading ? (
          <div className="grid size-full place-items-center">
            <LogoSpinner />
          </div>
        ) : (
          <div className="size-full overflow-y-auto px-page-x py-6">
            <Outlet />
          </div>
        )}
      </ContentWrapper>
    </>
  );
});
