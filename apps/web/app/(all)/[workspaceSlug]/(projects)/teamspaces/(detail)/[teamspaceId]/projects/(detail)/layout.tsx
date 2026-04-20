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

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { TeamspaceProjectDetailHeader } from "./header";

type TeamspaceProjectDetailLayoutProps = {
  workspaceSlug: string;
  teamspaceId: string;
  projectId: string;
};

export default function TeamspaceProjectDetailLayout(props: TeamspaceProjectDetailLayoutProps) {
  const { workspaceSlug, teamspaceId, projectId } = props;
  return (
    <>
      <AppHeader
        header={
          <TeamspaceProjectDetailHeader workspaceSlug={workspaceSlug} teamspaceId={teamspaceId} projectId={projectId} />
        }
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
