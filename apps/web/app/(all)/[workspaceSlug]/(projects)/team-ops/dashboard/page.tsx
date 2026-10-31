/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { DashboardRoot } from "@/components/team-ops/dashboard";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function DashboardPage({ params }: Route.ComponentProps) {
  const { currentWorkspace } = useWorkspace();
  return (
    <>
      <PageHead title={currentWorkspace?.name ? `${currentWorkspace.name} - Dashboard` : undefined} />
      <DashboardRoot workspaceSlug={params.workspaceSlug} />
    </>
  );
}

export default observer(DashboardPage);
