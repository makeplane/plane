/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { CapacityDashboard } from "@/plane-web/components/time-tracking/capacity";
import type { Route } from "./+types/page";

const CapacityPage = observer(({ params }: Route.ComponentProps) => {
    const { workspaceSlug, projectId } = params;

    return (
        <>
            <PageHead title="Capacity Dashboard" />
            <CapacityDashboard workspaceSlug={workspaceSlug} projectId={projectId} />
        </>
    );
});

export default CapacityPage;
