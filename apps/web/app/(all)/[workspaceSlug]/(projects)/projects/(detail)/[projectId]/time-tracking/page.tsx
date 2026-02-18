/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { TimeTrackingReportPage } from "@/components/time-tracking/time-tracking-report-page";
import type { Route } from "./+types/page";

const TimeTrackingPage = observer(({ params }: Route.ComponentProps) => {
  const { workspaceSlug, projectId } = params;
  return (
    <>
      <PageHead title="Time Tracking" />
      <TimeTrackingReportPage workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
});

TimeTrackingPage.displayName = "TimeTrackingPage";

export default TimeTrackingPage;
