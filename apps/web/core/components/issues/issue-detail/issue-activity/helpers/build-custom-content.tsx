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
import { ActivityLink } from "./activity-message-components";

/**
 * Build customContent for cycle/module entity fields.
 */
export function EntityActivityContent({
  activity,
  entityName,
  entityPath,
}: {
  activity: TIssueActivity;
  entityName: string;
  entityPath: string;
}) {
  const ws = activity.workspace_detail?.slug;
  const proj = activity.project;

  switch (activity.verb) {
    case "created":
      return (
        <>
          <span>added this work item to the {entityName} </span>
          <ActivityLink
            href={`/${ws}/projects/${proj}/${entityPath}/${activity.new_identifier}`}
            label={activity.new_value}
          />
        </>
      );
    case "updated":
      return (
        <>
          <span>set the {entityName} to </span>
          <ActivityLink
            href={`/${ws}/projects/${proj}/${entityPath}/${activity.new_identifier}`}
            label={activity.new_value}
          />
        </>
      );
    default: {
      // deleted — NOTE: Backend stores cycle name in new_value even for deletions
      const label = entityName === "cycle" ? activity.new_value : activity.old_value;
      return (
        <>
          <span>removed the work item from the {entityName} </span>
          <ActivityLink href={`/${ws}/projects/${proj}/${entityPath}/${activity.old_identifier}`} label={label} />
        </>
      );
    }
  }
}

/**
 * Build customContent for customer / customer_request fields.
 */
export function CustomerActivityContent({ activity, label }: { activity: TIssueActivity; label: string }) {
  const ws = activity.workspace_detail?.slug;

  switch (activity.verb) {
    case "created":
      return (
        <>
          <span>added this work item to the {label} </span>
          <ActivityLink href={`/${ws}/customers/${activity.new_identifier}`} label={activity.new_value} />
        </>
      );
    default:
      return (
        <>
          <span>removed the work item from the {label} </span>
          <ActivityLink href={`/${ws}/customers/${activity.old_identifier}`} label={activity.old_value} />
        </>
      );
  }
}

/**
 * Build customContent for milestone field.
 */
export function MilestoneActivityContent({ activity }: { activity: TIssueActivity }) {
  const overviewUrl = `/${activity.workspace_detail?.slug}/projects/${activity.project}/overview`;

  switch (activity.verb) {
    case "created":
      return (
        <>
          <span>added this work item to the milestone </span>
          <ActivityLink href={overviewUrl} label={activity.new_value} />
        </>
      );
    case "updated":
      return (
        <>
          <span>changed the milestone to </span>
          <ActivityLink href={overviewUrl} label={activity.new_value} />
          <span> from </span>
          <ActivityLink href={overviewUrl} label={activity.old_value} />
        </>
      );
    default:
      return (
        <>
          <span>removed the work item from the milestone </span>
          <ActivityLink href={overviewUrl} label={activity.old_value} />
        </>
      );
  }
}
