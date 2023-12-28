import { Request, Response } from "express";
import { Controller, Get, Post } from "@overnightjs/core";
import { getSlackMessageTemplate } from "../utils/slack/message-templates";
import { SlackService } from "../services/slack.service";
import { issueActivitySummary } from "../utils/slack/generateActivityMessage";
import { logger } from "../utils/logger";
import {
  CreateIssueModalViewProjects,
  notificationModal,
} from "../utils/slack/create-issue-modal";
import { ProjectService } from "../services/project.service";
import { convertToSlackOptions } from "../utils/slack/convert-to-slack-options";
import { processSlackPayload } from "../handlers/slack/core";
import { TSlackPayload } from "../types/slack";
import { MQSingleton } from "../mq/singleton";
import { DatabaseSingleton } from "../db/singleton";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { notifications } from "../db/schema/notifications.schema";
import { generateNotificationMessage } from "../utils/generateNotificationMessage";

@Controller("api/slack")
export class SlackController {
  @Post("")
  async postActivity(req: Request, res: Response) {
    try {
      // Initiate Slack Service
      const slackService = new SlackService();

      // Convert Slack message from the issueActivity provided from the request
      const issueActivityData = req.body;
      const activitySummary = await issueActivitySummary(issueActivityData);

      // Convert message string into slack message blocks format
      const issue_template = getSlackMessageTemplate(activitySummary);

      // send message to slack
      slackService.sendMessage(issue_template);

      res.status(200);
      return;
    } catch (error) {
      logger.error(error);
      return res.json({ message: "Server error" });
    }
  }

  @Post("trigger/ui/notifications/")
  async triggerNotificationsModal(req: Request, res: Response) {
    const slackService = new SlackService();
    const db = DatabaseSingleton.getInstance().db;

    const slackUserInfo = await slackService.getUserInfo(req.body.user_id);
    const displayedSlackUser = await slackUserInfo?.json();
    const planeUser = await db?.query.users.findFirst({
      where: eq(users.email, displayedSlackUser?.user?.profile?.email),
    });

    if (planeUser === undefined || planeUser === null) {
      console.log("no plane user");
      res.status(200).send("");
    }

    const fetchedNotifications = await db?.query.notifications.findMany({
      where: eq(notifications.receiverId, planeUser.id),
      with: { triggeredBy: true, project: true, createdBy: true },
    });

    const notificationMessages: string[] = fetchedNotifications.map(
      (notification) => generateNotificationMessage(notification),
    );

    const response = await slackService.openModal(
      req.body.trigger_id,
      notificationModal(notificationMessages),
    );

    const json = await response.json();

    res.status(200);
  }

  @Post("trigger/ui/create-issue/")
  async triggerCreateIssueModal(req: Request, res: Response) {
    const slackService = new SlackService();
    const projectService = new ProjectService();
    const mq = MQSingleton.getInstance();

    const text = req.body.text;

    const teamId = req.body.team_id;

    const workspaceId = await slackService.getWorkspaceId(teamId);

    if (!workspaceId) {
      return res.json({
        response_type: "ephemeral",
        text: "Workspace not found, Are you sure you have installed the slack in your plane workspace?",
      });
    }

    if (text === "") {
      const projectList =
        await projectService.getProjectsForWorkspace(workspaceId);
      const projectPlainTextOption = convertToSlackOptions(projectList);

      await slackService.openModal(
        req.body.trigger_id,
        CreateIssueModalViewProjects(projectPlainTextOption),
      );

      res.status(200).send("");
    } else {
      const issue_parts = text.split(" ");
      if (issue_parts.length < 3) {
        return res.json({
          response_type: "ephemeral",
          text: "Incorrect format, please use the following format: /takeoff <project-identifier> <issue-title> <issue-description>",
        });
      }

      const projectIdentifier = issue_parts[0].toUpperCase();
      const issueTitle = issue_parts[1];
      const issueDescription = issue_parts[2];

      const project =
        await projectService.getProjectByIdentifier(projectIdentifier);

      if (!project) {
        return res.json({
          response_type: "ephemeral",
          text: "Project not found",
        });
      }

      const userId = req.body.user_id;
      const userInfoResponse = await slackService.getUserInfo(userId);
      if (!userInfoResponse) {
        return res.json({
          response_type: "ephemeral",
          text: "Unable to get user info at this moment.",
        });
      }

      const displayedUser = await userInfoResponse.json();

      const issueSync = {
        args: [],
        kwargs: {
          data: {
            type: "slack.create_issue",
            title: issueTitle,
            description: issueDescription,
            created_by: {
              email: displayedUser?.user?.profile?.email,
              name: displayedUser?.user?.name,
            },
            priority: "none",
            workspace_id: workspaceId,
            project_id: project.id,
            assignees: [],
          },
        },
      };

      mq.publish(issueSync, "plane.bgtasks.importer_task.import_task");

      res.json({
        response_type: "ephemeral",
        text: "Successfully created issue",
      });
    }
  }

  @Post("events")
  async handleSlackEvents(req: Request, res: Response) {
    const payload = JSON.parse(req.body.payload) as TSlackPayload;

    const success = await processSlackPayload(payload);

    if (!success) {
      return res.json({
        response_type: "ephemeral",
        text: "Unable to process payload, please try again later.",
      });
    }

    if (success && payload.type === "view_submission") {
      return res.send({
        response_action: "clear",
      });
    }

    return res.json({
      response_type: "ephemeral",
      text: "Event Processed Successfully",
    });
  }
}
