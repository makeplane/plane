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

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import type { TIssueActivity, EInboxIssueSource as EInboxIssueSourceType } from "@plane/types";
import { EInboxIssueSource } from "@plane/types";
import { calculateTimeAgo, renderFormattedDate, renderFormattedTime } from "@plane/utils";
import type { ActivityItemData } from "@plane/blocks/activity";
import { resolveActorInfo } from "./resolve-actor-info";
import { ActivityMessage } from "./format-activity-message";
import { formatFieldValue } from "./format-field-value";
import { FieldIcon } from "./field-icon";
import { EntityActivityContent, CustomerActivityContent, MilestoneActivityContent } from "./build-custom-content";
import { SourceCreatedLabel, ConvertedToEpicLabel, ConvertedToWorkItemLabel } from "./activity-message-components";

/**
 * Build the actor element (link or plain text) from actor info.
 */
function ActorElement({ actor }: { actor: { name: string; url?: string } }) {
  if (actor.url) {
    return (
      <Link href={actor.url} className="font-medium text-primary hover:underline">
        {actor.name}
      </Link>
    );
  }
  return <span className="font-medium text-primary">{actor.name}</span>;
}

/**
 * Map a TIssueActivity record to the pure-data ActivityItemData shape.
 * Handles all standard field types. For fields requiring React hooks (e.g., relation fields),
 * the caller should override `customContent` and `icon` on the returned data.
 */
export function mapActivityToItemData(activity: TIssueActivity): ActivityItemData {
  const actor = resolveActorInfo(activity);

  let customContent: ReactNode = undefined;
  let icon: ReactNode = undefined;

  const field = activity.field ?? null;

  // "created via {source}" — needs custom content for the source label
  if (!field && activity.verb === "created") {
    const source = activity.source_data?.source as EInboxIssueSourceType | undefined;
    if (source && source !== EInboxIssueSource.IN_APP) {
      customContent = <SourceCreatedLabel source={source} />;
    }
  }

  // Cycle / Module / Customer / Milestone / Work Item / Epic
  if (field === "cycles") {
    customContent = <EntityActivityContent activity={activity} entityName="cycle" entityPath="cycles" />;
  } else if (field === "modules") {
    customContent = <EntityActivityContent activity={activity} entityName="module" entityPath="modules" />;
  } else if (field === "customer") {
    customContent = <CustomerActivityContent activity={activity} label="customer" />;
  } else if (field === "customer_request") {
    customContent = <CustomerActivityContent activity={activity} label="customer request" />;
  } else if (field === "milestones") {
    customContent = <MilestoneActivityContent activity={activity} />;
  } else if (field === "work_item") {
    customContent = (
      <ConvertedToEpicLabel
        identifier={activity?.project_detail?.identifier}
        sequenceId={activity?.issue_detail?.sequence_id}
      />
    );
  } else if (field === "epic") {
    if (activity.verb === "created") {
      customContent = <>created the epic.</>;
    } else {
      customContent = (
        <ConvertedToWorkItemLabel
          identifier={activity?.project_detail?.identifier}
          sequenceId={activity?.issue_detail?.sequence_id}
        />
      );
      icon = <ArrowRightLeft className="h-3.5 w-3.5 text-secondary" />;
    }
  }

  const formattedOld = formatFieldValue(field, activity.old_value);
  const formattedNew = formatFieldValue(field, activity.new_value);

  return {
    actor: <ActorElement actor={actor} />,
    timestamp: calculateTimeAgo(activity.created_at),
    tooltipTimestamp: `${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`,
    customContent: customContent ?? (
      <ActivityMessage field={field} verb={activity.verb} oldValue={formattedOld} newValue={formattedNew} />
    ),
    icon: icon ?? <FieldIcon field={field} newValue={activity.new_value} />,
  };
}
