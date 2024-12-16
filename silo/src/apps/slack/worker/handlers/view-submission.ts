import { TViewSubmissionPayload } from "@silo/slack";
import { createSlackLinkback } from "../../views/issue-linkback";
import { getConnectionDetails } from "../../helpers/connection-details";
import { parseIssueFormData } from "../../helpers/parse-issue-form";
import { SlackPrivateMetadata } from "../../types/types";
import { ENTITIES } from "../../helpers/constants";
import { createEntityConnection, getEntityConnectionByEntityId } from "@/db/query/connection";
import { logger } from "@/logger";

export const handleViewSubmission = async (data: TViewSubmissionPayload) => {
  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);
  const projects = await planeClient.project.list(workspaceConnection.workspaceSlug);
  projects.results.filter((project) => project.is_member === true);
  // @ts-ignore
  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata;

  if (metadata.entityType === ENTITIES.ISSUE_SUBMISSION) {
    const parsedData = parseIssueFormData(data.view.state.values);
    if (metadata.entityPayload.type === "message_action") {
      const issue = await planeClient.issue.create(workspaceConnection.workspaceSlug, parsedData.project, {
        name: parsedData.title,
        description_html: parsedData.description == null ? "<p></p>" : parsedData.description,
        state: parsedData.state,
        priority: parsedData.priority,
        labels: parsedData.labels,
      });

      const project = await planeClient.project.getProject(workspaceConnection.workspaceSlug, parsedData.project);
      const states = await planeClient.state.list(workspaceConnection.workspaceSlug, issue.project);
      const cycles = await planeClient.cycles.list(workspaceConnection.workspaceSlug, issue.project);

      const linkBack = createSlackLinkback(
        workspaceConnection.workspaceSlug,
        project,
        states.results,
        cycles.results,
        issue
      );

      const res = await slackService.sendThreadMessage(
        metadata.entityPayload.channel.id,
        metadata.entityPayload.message.ts,
        linkBack,
        issue
      );

      if (parsedData.enableThreadSync && res.ok) {
        // If thread sync is enabled, create an entity connection for the issue
        // check if the connection already exists
        const connections = await getEntityConnectionByEntityId(res.message.thread_ts);
        if (!connections || connections.length === 0) {
          await createEntityConnection({
            workspaceId: workspaceConnection.workspaceId,
            workspaceSlug: workspaceConnection.workspaceSlug,
            projectId: parsedData.project,
            workspaceConnectionId: workspaceConnection.id,
            entityId: res.message.thread_ts,
            entityData: res,
            entitySlug: issue.id,
          });
        }
      } else {
        logger.error("Error sending thread message:");
        console.error(res);
      }
    }
  } else if (metadata.entityType === ENTITIES.ISSUE_COMMENT_SUBMISSION) {
    const {
      thread_ts,
      channel,
      user,
      value,
    }: {
      thread_ts: string;
      channel: string;
      user: string;
      value: string;
    } = metadata.entityPayload;

    const values = value.split(".");

    if (values.length === 2) {
      const projectId = values[0];
      const issueId = values[1];

      let comment = "";

      Object.entries(data.view.state.values).forEach(([_, blockData]: [string, any]) => {
        if (blockData.comment_submit?.type === "plain_text_input") {
          comment = blockData.comment_submit.value;
        }
      });

      const slackUser = await slackService.getUserInfo(user);
      const projectMembers = await planeClient.users.list(workspaceConnection.workspaceSlug, projectId);

      const member = projectMembers.find((member) => member.email === slackUser?.user.profile.email);

      await planeClient.issueComment.create(workspaceConnection.workspaceSlug, projectId, issueId, {
        comment_html: "<p>" + comment + "</p>",
        created_by: member?.id,
        external_source: "SLACK-PRIVATE_COMMENT",
        external_id: data.view.id,
      });

      await slackService.sendEphemeralMessage(user, `Comment successfully added to issue. 😄`, channel, thread_ts);
    }
  }
};
