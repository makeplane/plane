/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { LeaveRoot } from "@/components/team-ops/leave";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function LeavePage({ params }: Route.ComponentProps) {
  const { currentWorkspace } = useWorkspace();
  return (
    <>
      <PageHead title={currentWorkspace?.name ? `${currentWorkspace.name} - Leave` : undefined} />
      <LeaveRoot workspaceSlug={params.workspaceSlug} />
    </>
  );
}

export default observer(LeavePage);
