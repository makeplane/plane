import { TSlackIssueEntityData } from "@plane/etl/slack";
import { PlaneWebhookPayload } from "@plane/sdk";
import { Store } from "@/worker/base";
import { getConnectionDetailsForIssue } from "../../helpers/connection-details";
import { ActivityForSlack, PlaneActivityWithTimestamp } from "../../types/types";

const ignoredFieldUpdates = ["description", "attachment", "sort_order"];

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

  const { slackService, entityConnection } = details;

  const message = createSlackBlocksFromActivity(activities);
  const entityData = entityConnection.entity_data as TSlackIssueEntityData;

  const channel = entityData.channel;
  const messageTs = entityData.message.ts;

  if (message.length === 0) {
    return;
  }

  await slackService.sendThreadMessage(channel, messageTs, {
    text: "Work Item Updated",
    blocks: message,
  });
};

// Message formatter function
const formatMessage = (field: string, cleanField: string, newValue: string, actor: string): string => {
  switch (field) {
    case "link":
      return `\n• *${actor}* added link ${newValue}`;
    case "reaction": {
      const emoji = String.fromCodePoint(parseInt(newValue));
      return `\n• *${actor}* reacted with *${emoji}*`;
    }
    default:
      return `\n• *${actor}* updated *${cleanField}* to *${newValue}*`;
  }
};

export const createSlackBlocksFromActivity = (fields: ActivityForSlack[]) => {
  // Sort the fields so that array fields are at the end
  fields.sort((a, b) => (a.isArrayField ? 1 : -1));

  let message = "Work item updated 🔄\n";

  // Filter out fields that should be ignored
  fields = fields.filter((field) => !shouldIgnoreField(field.field, ignoredFieldUpdates));

  if (fields.length === 0) {
    return [];
  }

  fields.forEach((field) => {
    const cleanField = field.field.replace("_", " ");

    if (field.isArrayField) {
      if (field.added.length > 0 || field.removed.length > 0) {
        message += `\n• *${cleanField} updated:*`;
        if (field.added.length > 0) {
          message += `\n    • Added _${field.added.join(", ")}_`;
        }
        if (field.removed.length > 0) {
          message += `\n    • Removed _${field.removed.join(", ")}_`;
        }
      }
    } else {
      message += formatMessage(field.field, cleanField, field.newValue, field.actor);
    }
  });

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: message,
      },
    },
  ];

  return blocks;
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
    const actor = fieldActivities[0].actor.display_name;

    if (isArrayField) {
      const { added, removed } = getArrayActivity(fieldActivities);
      latestActivities.set(field, {
        isArrayField: true,
        field,
        actor,
        added,
        removed,
      });
    } else {
      // For singular fields, use the last activity's new_value
      const latestActivity = fieldActivities[fieldActivities.length - 1];
      latestActivities.set(field, {
        isArrayField: false,
        field,
        actor,
        newValue: latestActivity.new_value || "",
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

// Helper function to check if a field should be ignored
const shouldIgnoreField = (fieldName: string, ignoredFieldUpdates: string[]): boolean => {
  // Check if any ignored field is a prefix of this field
  // This handles cases like "description" also ignoring "description_html"
  for (const ignoredField of ignoredFieldUpdates) {
    if (fieldName === ignoredField || fieldName.startsWith(ignoredField + "_")) {
      return true;
    }
  }

  return false;
};
