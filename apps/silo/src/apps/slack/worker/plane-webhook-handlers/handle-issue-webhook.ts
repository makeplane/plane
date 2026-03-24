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

import { E_SLACK_ENTITY_TYPE } from "@plane/etl/slack";
import type {
  E_SLACK_PROJECT_UPDATES_EVENTS,
  TSlackIssueEntityData,
  TSlackProjectUpdatesConfig,
} from "@plane/etl/slack";
import type { Client, PlaneWebhookPayload } from "@plane/sdk";
import { Store } from "@/worker/base";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { getSlackToPlaneUserMapFromWC } from "../../helpers/user";
import type { ActivityForSlack, PlaneActivityWithTimestamp } from "../../types/types";
import { createActivityLinkback } from "../../views/activity";
import { getAPIClient } from "@/services/client";
import { logger } from "@plane/logger";
import { E_KNOWN_FIELD_KEY } from "@/types/form/base";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { STATE_GROUPS } from "@plane/constants";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";

const apiClient = getAPIClient();

/*
 * Testing Cases for Project Updates
 * 1. Disable all the event, there must not be any update propogated for anything ✓
 *    1. In this case, the event of creation of the work item should still come ✓
 * 2. Enabled only the state change event, in that case, all state change events should be propogated ✓
 * 3. In case you enable the specific state change event for cancelled and done, it should only send me events for those. ✓
 */

type TActivityMatcher = (
  ctx: { client: Client; workspaceSlug: string; projectId: string },
  activity: ActivityForSlack
) => Promise<boolean>;
const eventMatchers: Record<E_SLACK_PROJECT_UPDATES_EVENTS, TActivityMatcher> = {
  NEW_WORK_ITEM_CREATED: (_, __) => Promise.resolve(false),
  WORK_ITEM_COMMENT_CREATED: (_, __) => Promise.resolve(false),
  WORK_ITEM_STATE_CHANGED: (_ctx, activity) => Promise.resolve(activity.field === E_KNOWN_FIELD_KEY.STATE),
  WORK_ITEM_COMPLETED_OR_CANCELLED: async (ctx, activity) => {
    if (activity.isArrayField) return false;

    // Check if the given event is a state change event
    const isStateChangeEvent = activity.field === E_KNOWN_FIELD_KEY.STATE;

    if (!activity.newIdentifier) {
      const movedToCompletedState = activity.newValue?.toLowerCase() === "done";
      const movedToCancelledState = activity.newValue?.toLowerCase() === "cancelled";

      return isStateChangeEvent && (movedToCompletedState || movedToCancelledState);
    } else {
      const { client, workspaceSlug, projectId } = ctx;
      const newStateDetails = await client.state.getState(workspaceSlug, projectId, activity.newIdentifier);

      const movedToCompletedState = newStateDetails.group === STATE_GROUPS.completed.key;
      const movedToCancelledState = newStateDetails.group === STATE_GROUPS.cancelled.key;

      return isStateChangeEvent && (movedToCompletedState || movedToCancelledState);
    }
  },
};

export const handleIssueWebhook = async (payload: PlaneWebhookPayload) => {
  const activities = await getActivities(payload);
  // Ideally we won't hit this case, but just in case
  if (activities.length === 0) {
    return;
  }

  /*
    We are passing userId as null, because we don't know the user who updated the issue,
    and the message will be sent on behalf of the bot
  */
  const details = await getConnectionDetailsForIssue(payload, null, false);

  if (!details) {
    return;
  }

  const { slackService, entityConnection, workspaceConnection, planeClient } = details;

  const [projectEntityConnection] = await integrationConnectionHelper.getWorkspaceEntityConnections({
    workspace_connection_id: workspaceConnection.id,
    project_id: payload.project,
    entity_type: E_SLACK_ENTITY_TYPE.SLACK_PROJECT_UPDATES,
  });

  if (!entityConnection && !projectEntityConnection) {
    logger.info(
      "[Slack Issue Webhook] Neither entity connection nor project entity connection found for the given issue",
      payload
    );
    return;
  }

  const userMap = getSlackToPlaneUserMapFromWC(workspaceConnection);

  if (entityConnection) {
    const activityBlocks = createActivityLinkback({
      activities,
      workspaceSlug: workspaceConnection.workspace_slug,
      projectId: payload.project,
      issueId: payload.id,
      userMap: userMap,
    });

    const entityData = entityConnection.entity_data as TSlackIssueEntityData;

    const channel = entityData.channel;
    const messageTs = entityData.message.ts;

    if (activityBlocks.blocks.length === 0) {
      return;
    }

    await slackService.sendThreadMessage(channel, messageTs, {
      text: "Work Item Updated",
      blocks: activityBlocks.blocks,
    });
  }

  if (projectEntityConnection) {
    const channel = projectEntityConnection.entity_id;

    // Get the config, extract out the subscribed events from the config and filter activities according to the subscribed events
    const projectUpdatesConfig = projectEntityConnection.config as TSlackProjectUpdatesConfig;
    const subscribedEvents = projectUpdatesConfig?.subscribedEvents as E_SLACK_PROJECT_UPDATES_EVENTS[];

    if (!subscribedEvents) return;

    const activitiesForSubscribedEvents = await filterActivitiesBySubscribedEvents(
      {
        workspaceSlug: workspaceConnection.workspace_slug,
        projectId: payload.project,
        client: planeClient,
      },
      activities,
      subscribedEvents
    );

    if (activitiesForSubscribedEvents.length === 0) {
      return;
    }

    const issueDetails = await planeClient.issue.getIssueWithFields(
      workspaceConnection.workspace_slug,
      payload.project,
      payload.id,
      ["project"]
    );

    const header = `Work Item <${getIssueUrlFromSequenceId(workspaceConnection.workspace_slug, issueDetails.project.identifier ?? "", issueDetails.sequence_id.toString())}|${issueDetails.project.identifier}-${issueDetails.sequence_id}> Updated`;

    // Create the blocks from the filtered activities
    const activityBlocks = createActivityLinkback({
      header,
      activities: activitiesForSubscribedEvents,
      workspaceSlug: workspaceConnection.workspace_slug,
      projectId: payload.project,
      issueId: payload.id,
      userMap: userMap,
    });

    if (activityBlocks.blocks.length === 0) {
      return;
    }

    const response = await slackService.sendMessageToChannel(channel!, {
      text: header,
      blocks: activityBlocks.blocks,
    });

    logger.info("[Slack Project Updates] Pushed activity to slack channel", response);
  }
};

/*
 * Takes in the activities and events subscribed as events, and with pattern matching filters out the events
 */
const filterActivitiesBySubscribedEvents = async (
  ctx: {
    client: Client;
    workspaceSlug: string;
    projectId: string;
  },
  activities: ActivityForSlack[],
  subscribedEvents: E_SLACK_PROJECT_UPDATES_EVENTS[]
) => {
  const enabledEvents = subscribedEvents.map((event) => eventMatchers[event]);

  const filteredActivities: ActivityForSlack[] = [];

  for (const activity of activities) {
    const matchResults = await Promise.all(enabledEvents.map((matcher) => matcher(ctx, activity)));

    if (matchResults.some((result) => result === true)) {
      filteredActivities.push(activity);
    }
  }

  return filteredActivities;
};
export const getActivities = async (payload: PlaneWebhookPayload): Promise<ActivityForSlack[]> => {
  const store = Store.getInstance();
  const key = `slack:issue:${payload.id}`;
  const activityList = await store.getList(key);

  if (!activityList) {
    return [];
  }

  await store.del(key);
  const activities = activityList.map((activity) => JSON.parse(activity) as PlaneActivityWithTimestamp);

  // Sort the activities by timestamp
  activities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  /*
    Group all the activities such that we can process each of them in a
    single pass whether it's an array field or a singular field
  */
  const fieldGroups = new Map<string, PlaneActivityWithTimestamp[]>();
  activities.forEach((activity) => {
    if (!fieldGroups.has(activity.field)) {
      fieldGroups.set(activity.field, []);
    }
    fieldGroups.get(activity.field)!.push(activity);
  });

  const latestActivities = new Map<string, ActivityForSlack>();

  /*
    For each field group, if it's an array field, we need to get the added and removed values
    If it's a singular field, we just need to get the latest value
  */
  for (const [field, fieldActivities] of fieldGroups.entries()) {
    const isArrayField = field.endsWith("s");
    const actorId = fieldActivities[0].actor.id;
    const actorDisplayName = fieldActivities[0].actor.display_name;

    if (isArrayField) {
      const { added, removed, addedIdentifiers, removedIdentifiers } = getArrayActivity(fieldActivities);
      latestActivities.set(field, {
        isArrayField: true,
        field,
        actorId,
        actorDisplayName,
        added,
        removed,
        addedIdentifiers,
        removedIdentifiers,
        timestamp: fieldActivities[fieldActivities.length - 1].timestamp,
      });
    } else {
      // For singular fields, use the last activity's new_value
      const latestActivity = fieldActivities[fieldActivities.length - 1];
      latestActivities.set(field, {
        isArrayField: false,
        field,
        actorId,
        actorDisplayName,
        newValue: latestActivity.new_value || "",
        oldValue: latestActivity.old_value || "",
        newIdentifier: latestActivity.new_identifier || "",
        oldIdentifier: latestActivity.old_identifier || "",
        timestamp: latestActivity.timestamp,
      });
    }
  }

  // Return the activities
  return Array.from(latestActivities.values());
};

export const getArrayActivity = (activities: PlaneActivityWithTimestamp[]) => {
  /*
    According to how plane shares the activity, if the old value is null and new values is something, something is added
    If the old value is something and new value is null, something is removed, we just need to collect those values with
    two arrays removed and added values
  */

  const added: string[] = [];
  const removed: string[] = [];
  const addedIdentifiers: string[] = [];
  const removedIdentifiers: string[] = [];

  for (const activity of activities) {
    if (activity.old_value === null && activity.new_value !== null) {
      added.push(activity.new_value);
      if (activity.new_identifier) {
        addedIdentifiers.push(activity.new_identifier);
      }
    } else if (activity.old_value !== null && activity.new_value === null) {
      removed.push(activity.old_value);
      if (activity.old_identifier) {
        removedIdentifiers.push(activity.old_identifier);
      }
    }
  }

  return { added, removed, addedIdentifiers, removedIdentifiers };
};
