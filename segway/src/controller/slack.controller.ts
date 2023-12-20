import { Request, Response } from "express";
import { Controller, Get, Post } from "@overnightjs/core";
import { getSlackMessageTemplate } from "../utils/slack/message-templates";
import { SlackService } from "../services/slack.service";
import { issueActivitySummary } from "../utils/slack/generateActivityMessage";
import { logger } from "../utils/logger";
import {
  CreateIssueModalViewFull,
  CreateIssueModalViewProjects,
} from "../utils/slack/create-issue-modal";
import { ProjectService } from "../services/project.service";
import { convertProjectToOptions } from "../utils/slack/convert-project-to-options";
import { processSlackPayload } from "../handlers/slack/core";
import { TSlackPayload } from "types/slack";

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

  @Post("trigger/ui/create-issue/")
  async triggerCreateIssueModal(req: Request, res: Response) {
    const slackService = new SlackService();
    const projectService = new ProjectService();

    const teamId = req.body.team_id;

    const workspaceId = await slackService.getWorkspaceId(teamId);

    if (!workspaceId) {
      res.sendStatus(500);
      return;
    }

    const projectList =
      await projectService.getProjectsForWorkspace(workspaceId);
    const projectPlainTextOption = convertProjectToOptions(projectList);

    await slackService.openModal(
      req.body.trigger_id,
      CreateIssueModalViewProjects(projectPlainTextOption),
    );
    res.sendStatus(200);
  }

  @Post("events")
  async handleSlackEvents(req: Request, res: Response) {
    const payload = JSON.parse(req.body.payload) as TSlackPayload;
    const success = processSlackPayload(payload);

    if (!success) {
      res.sendStatus(500);
    }

    // const selectedProjectId = payload.actions[0].selected_option.value;
    // const states = await projectService.getProjectStates(selectedProjectId);
    // const members = await projectService.getProjectMembers(selectedProjectId);
    // const labels = await projectService.getProjectLabels(selectedProjectId);

    res.sendStatus(200);
  }
}
