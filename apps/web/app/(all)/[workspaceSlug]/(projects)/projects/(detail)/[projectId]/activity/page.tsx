/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: project "Activity" (core/liviere/activity), registered in app/routes/extended.ts.

import { ProjectActivityPage } from "@/liviere/activity/activity-page";
import type { Route } from "./+types/page";

export default function ProjectActivityRoute({ params }: Route.ComponentProps) {
  return <ProjectActivityPage workspaceSlug={params.workspaceSlug} projectId={params.projectId} />;
}
