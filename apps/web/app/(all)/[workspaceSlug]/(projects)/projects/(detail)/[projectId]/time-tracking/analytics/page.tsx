/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { TimeTrackingReportPage } from "@/components/time-tracking/time-tracking-report-page";
import type { Route } from "../+types/page";

const AnalyticsPage = observer(({ params }: Route.ComponentProps) => {
    const { workspaceSlug, projectId } = params;
    return (
        <>
            <PageHead title="Project Analytics" />
            <TimeTrackingReportPage workspaceSlug={workspaceSlug} projectId={projectId} />
        </>
    );
});

export default AnalyticsPage;
