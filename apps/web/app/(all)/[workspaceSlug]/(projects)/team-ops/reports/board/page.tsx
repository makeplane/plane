/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { ReportsBoardRoot } from "@/components/team-ops/reports";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function ReportsBoardPage({ params }: Route.ComponentProps) {
  const { currentWorkspace } = useWorkspace();
  return (
    <>
      <PageHead title={currentWorkspace?.name ? `${currentWorkspace.name} - Team board` : undefined} />
      <ReportsBoardRoot workspaceSlug={params.workspaceSlug} />
    </>
  );
}

export default observer(ReportsBoardPage);
