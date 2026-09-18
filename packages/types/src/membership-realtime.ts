/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TMembershipRealtimeEventType = "workspace.member.removed" | "project.member.removed";

export type TMembershipRealtimeEvent = {
  type: TMembershipRealtimeEventType;
  actor_id: string;
  user_id: string;
  workspace_id: string;
  workspace_slug: string;
  project_id?: string | null;
};
