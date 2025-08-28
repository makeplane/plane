import { getIssueUrlFromId } from "@/helpers/urls";
import { invertStringMap } from "@/helpers/utils";
import { formatActivityValue } from "../helpers/activity";
import {
  createSlackLinkbackMutationContext,
  E_MUTATION_CONTEXT_FORMAT_TYPE,
  E_MUTATION_CONTEXT_ITEM_TYPE,
} from "../helpers/blocks";
import { ACTIONS, IGNORED_FIELD_UPDATES } from "../helpers/constants";
import { ActivityForSlack } from "../types/types";

type ActivityProps = {
  // Activites to showcase in the linkback
  activities: ActivityForSlack[];

  // Details for creating the link for the `View in Plane` button
  workspaceSlug: string;
  projectId: string;
  issueId: string;

  // userMap, as we need to mention the user if the relation exist
  userMap: Map<string, string>;
};

export const createActivityLinkback = (activity: ActivityProps) => {
  const { activities, workspaceSlug, projectId, issueId, userMap } = activity;

  const blocks: any[] = [];
  const planeToSlackUserMap = invertStringMap(userMap);

  const title = "*Work Item Updated*\n\n";

  /*
   * At this point, we are debouncing on the activities, and we'll get a group
   * of activities performed on a work item. Although, the function expects to
   * recieve activites with old and new values with no transition states, there
   * can be multiple actors performing the activities. Hence, we need to group
   * the activities by the actor and then create the change text for each actor.
   */
  const activitiesByActor = activities.reduce(
    (acc, activity) => {
      const { actorId } = activity;
      if (!acc[actorId]) {
        acc[actorId] = [];
      }
      acc[actorId].push(activity);
      return acc;
    },
    {} as Record<string, ActivityForSlack[]>
  );

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: title,
    },
  });

  for (const [_, actorActivities] of Object.entries(activitiesByActor)) {
    let changeText = "";
    const actorId = actorActivities[0].actorId;
    const actorDisplayName = actorActivities[0].actorDisplayName;

    for (const activity of actorActivities) {
      const { field } = activity;
      const isIgnoredField = IGNORED_FIELD_UPDATES.includes(field);
      if (isIgnoredField) {
        continue;
      }

      changeText += formatActivityValue(workspaceSlug, planeToSlackUserMap, activity);
    }
    // Main section with field change
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: changeText,
      },
    });

    // Divider
    blocks.push({
      type: "divider",
    });

    const mutationContext = createSlackLinkbackMutationContext({
      issue: {
        updated_by: actorId,
        created_by: actorId,
      },
      planeToSlackUserMap,
      workspaceSlug,
      options: {
        itemType: E_MUTATION_CONTEXT_ITEM_TYPE.WORK_ITEM,
        format: E_MUTATION_CONTEXT_FORMAT_TYPE.UPDATE_ONLY,
      },
    });

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: mutationContext,
        },
      ],
    });
  }

  // Action buttons
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View in Plane",
          emoji: true,
        },
        url: getIssueUrlFromId(workspaceSlug, projectId, issueId),
        action_id: "view_in_plane",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Update Work Item",
          emoji: true,
        },
        value: `${projectId}.${issueId}`,
        action_id: ACTIONS.UPDATE_WORK_ITEM,
      },
    ],
  });

  return { blocks };
};
