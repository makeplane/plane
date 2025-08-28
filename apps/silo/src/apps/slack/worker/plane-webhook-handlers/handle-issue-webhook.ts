import { TSlackIssueEntityData } from "@plane/etl/slack";
import { PlaneWebhookPayload } from "@plane/sdk";
import { Store } from "@/worker/base";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { getUserMapFromSlackWorkspaceConnection } from "../../helpers/user";
import { ActivityForSlack, PlaneActivityWithTimestamp } from "../../types/types";
import { createActivityLinkback } from "../../views/activity";


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
  const details = await getConnectionDetailsForIssue(payload, null);

  if (!details) {
    return;
  }

  const { slackService, entityConnection, workspaceConnection } = details;

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);

  const activityBlocks = createActivityLinkback({
    activities,
    workspaceSlug: entityConnection.workspace_slug,
    projectId: entityConnection.project_id!,
    issueId: payload.id,
    userMap,
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
      const { added, removed } = getArrayActivity(fieldActivities);
      latestActivities.set(field, {
        isArrayField: true,
        field,
        actorId,
        actorDisplayName,
        added,
        removed,
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

  for (const activity of activities) {
    if (activity.old_value === null && activity.new_value !== null) {
      added.push(activity.new_value);
    } else if (activity.old_value !== null && activity.new_value === null) {
      removed.push(activity.old_value);
    }
  }

  return { added, removed };
};
