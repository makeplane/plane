/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: decision register (liviere/decisions), registered in app/routes/extended.ts.

import { ProjectDecisionsPage } from "@/liviere/decisions/decisions-page";
import type { Route } from "./+types/page";

export default function ProjectDecisionsRoute({ params }: Route.ComponentProps) {
  return <ProjectDecisionsPage workspaceSlug={params.workspaceSlug} projectId={params.projectId} />;
}
