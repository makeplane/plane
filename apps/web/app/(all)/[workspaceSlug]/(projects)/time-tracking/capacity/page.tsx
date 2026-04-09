/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { PageHead } from "@/components/core/page-title";
import { CapacityDashboard } from "@/plane-web/components/time-tracking/capacity";

const WorkspaceCapacityPage = observer(function WorkspaceCapacityPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  return (
    <>
      <PageHead title="Capacity" />
      <CapacityDashboard workspaceSlug={workspaceSlug!} defaultCrossWorkspace />
    </>
  );
});

export default WorkspaceCapacityPage;
