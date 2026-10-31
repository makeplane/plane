/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { CalendarReportsRoot } from "@/components/team-ops/calendar";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function CalendarReportsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Calendar reports` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <CalendarReportsRoot workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(CalendarReportsPage);
