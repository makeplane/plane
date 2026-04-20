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
// components
import { PageHead } from "@/components/core/page-title";
import { RoleDetailRoot } from "@/components/roles-and-schemes/roles/role-detail-root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import type { Route } from "./+types/page";

function ProjectRoleDetailPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, slug } = params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Project roles & Schemes` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <RoleDetailRoot workspaceSlug={workspaceSlug} namespace="project" roleSlug={slug} />
    </>
  );
}

export default observer(ProjectRoleDetailPage);
