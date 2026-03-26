/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TIssueActivity } from "@plane/types";

/**
 * Resolve the actor display info from an activity record.
 */
export function resolveActorInfo(activity: TIssueActivity): { name: string; url?: string } {
  // "created" via external source (Forms, Email) — show external actor
  if (!activity.field && activity.verb === "created") {
    const source = activity.source_data?.source;
    if (source && ["FORMS", "EMAIL"].includes(source)) {
      const username = activity.source_data?.extra?.username;
      const email = activity.source_data?.source_email;
      if (username) return { name: `${username}${email ? ` (${email})` : ""}` };
      if (email) return { name: email };
      return { name: "Plane" };
    }
  }

  // archived_at "archive" action is a system action
  if (activity.field === "archived_at" && activity.new_value === "archive") {
    return { name: "Plane" };
  }

  // Intake bot names
  if (activity.actor_detail?.display_name?.includes("-intake")) {
    return { name: "Plane" };
  }

  return {
    name: activity.actor_detail?.display_name ?? "",
    url:
      activity.workspace_detail?.slug && activity.actor_detail?.id
        ? `/${activity.workspace_detail.slug}/profile/${activity.actor_detail.id}`
        : undefined,
  };
}
