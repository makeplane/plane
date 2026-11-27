/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "New" work items (liviere/unread), registered in app/routes/extended.ts.

import { NewWorkItemsPage } from "@/liviere/unread/new-work-items-page";
import type { Route } from "./+types/page";

export default function NewWorkItemsRoute({ params }: Route.ComponentProps) {
  return <NewWorkItemsPage workspaceSlug={params.workspaceSlug} />;
}
