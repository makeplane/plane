/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { PageHead } from "@/components/core/page-title";
import { WorkspaceAnalyticsTimesheetGrid } from "@/plane-web/components/time-tracking/analytics";

const WorkspaceAnalyticsPage = observer(function WorkspaceAnalyticsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  return (
    <>
      <PageHead title="Workspace Analytics" />
      <WorkspaceAnalyticsTimesheetGrid workspaceSlug={workspaceSlug!} />
    </>
  );
});

export default WorkspaceAnalyticsPage;
