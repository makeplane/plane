// overnight js
import { Request, Response } from "express";
import { Controller, Post, Middleware } from "@overnightjs/core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Server as SocketIOServer } from "socket.io";
// mq
import { MQSingleton } from "../mq/singleton";
// middleware
import AuthKeyMiddleware from "../middleware/authkey.middleware";
// axios
import axios from "axios";
// logger
import { logger } from "../utils/logger";
// jira
import { loadIssues, loadComments } from "../utils/paginator";
import { EJiraPriority, EJiraStatus } from "../utils/constant";

const IMPORTER_TASK_ROUTE = "plane.bgtasks.importer_task.import_issue_sync";
const IMPORTER_STATUS_TASK_ROUTE =
  "plane.bgtasks.importer_task.import_status_sync";
const MEMBER_TASK_ROUTE = "plane.bgtasks.importer_task.import_member_sync";
const LABEL_TASK_ROUTE = "plane.bgtasks.importer_task.import_label_sync";
const MODULE_TASK_ROUTE = "plane.bgtasks.importer_task.import_module_sync"

@Controller("api/jira")
export class JiraController {
  /**
   * This controller houses all routes for the Jira Importer
   */

  // Initialize database and mq
  db: PostgresJsDatabase;
  mq: MQSingleton;
  io: SocketIOServer;

  constructor(db: PostgresJsDatabase, mq: MQSingleton, io: SocketIOServer) {
    this.db = db;
    this.mq = mq;
    this.io = io;
  }

  @Post("")
  @Middleware([AuthKeyMiddleware])
  private async home(req: Request, res: Response) {
    try {
      const { email, api_token, project_key, cloud_hostname } = req.body;
      const auth = {
        username: email,
        password: api_token,
      };
      const headers = {
        Accept: "application/json",
      };

      // Constructing URLs
      const issueUrl = `https://${cloud_hostname}/rest/api/3/search?jql=project=${project_key} AND issuetype != Epic`;
      const moduleUrl = `https://${cloud_hostname}/rest/api/3/search?jql=project=${project_key} AND issuetype = Epic`;
      const statusUrl = `https://${cloud_hostname}/rest/api/3/project/${project_key}/statuses`;
      const labelsUrl = `https://${cloud_hostname}/rest/api/3/label/?jql=project=${project_key}`;
      const usersUrl = `https://${cloud_hostname}/rest/api/3/users/search?jql=project=${project_key}`;

      // Making requests
      const [
        issueResponse,
        moduleResponse,
        statusResponse,
        labelsResponse,
        usersResponse,
      ] = await Promise.all([
        axios.get(issueUrl, { auth, headers }),
        axios.get(moduleUrl, { auth, headers }),
        axios.get(statusUrl, { auth, headers }),
        axios.get(labelsUrl, { auth, headers }),
        axios.get(usersUrl, { auth, headers }),
      ]);

      const issuesTotal = issueResponse.data.total;
      const modulesTotal = moduleResponse.data.total;
      const labelsTotal = labelsResponse.data.total;
      const statusCount = statusResponse.data[0].statuses.length;

      const usersData = usersResponse.data.filter(
        (user: any) => user.accountType === "atlassian"
      );

      return res.status(200).json({
        issues: issuesTotal,
        modules: modulesTotal,
        labels: labelsTotal,
        states: statusCount,
        users: usersData,
      });
    } catch (error) {
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }

  @Post("import")
  @Middleware([AuthKeyMiddleware])
  private async import(req: Request, res: Response) {
    res.status(200).json({
      message: "Successful",
    });

    try {
      const {
        data: { users },
        metadata: { email, api_token, project_key, cloud_hostname },
        workspace_id,
        project_id,
        created_by,
        importer_id,
        config: { epics_to_modules },
      } = req.body;

      const auth = {
        username: email,
        password: api_token,
      };

      const headers = {
        Accept: "application/json",
      };

      // Users
      for (const user of users) {
        if (
          user?.email &&
          (user?.import || user?.import == "invite" || user?.invite == "map")
        ) {
          const memberSync = {
            args: [], // args
            kwargs: {
              data: {
                email: user?.email,
                workspace_id: workspace_id,
                project_id: project_id,
                created_by_id: created_by,
                importer_id: importer_id,
              },
            },
            other_data: {}, // other data
          };
          this.mq?.publish(memberSync, MEMBER_TASK_ROUTE);
        }
      }

      // All labels
      const labelsUrl = `https://${cloud_hostname}/rest/api/3/label/?jql=project=${project_key}`;
      const { data } = await axios({
        url: labelsUrl,
        auth: auth,
        method: "get",
      });

      for (const label of data.values) {
        const labelSync = {
          args: [],
          kwargs: {
            data: {
              name: label,
              external_source: "jira",
              project_id: project_id,
              workspace_id: workspace_id,
              importer_id: importer_id,
              created_by_id: created_by,
            },
          },
        };
        this.mq?.publish(labelSync, LABEL_TASK_ROUTE);
      }

      // All issues
      let url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key}&fields=comment, issuetype, summary, description, assignee, priority, status, labels, duedate, parent, parentEpic, subtasks&maxResults=100&expand=renderedFields`;
      if (epics_to_modules) {
         url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key} AND issuetype != Epic&fields=comment, issuetype, summary, description, assignee, priority, status, labels, duedate, parent, parentEpic, subtasks&maxResults=100&expand=renderedFields`;
      }

      for await (const issue of loadIssues(url, auth)) {
        // remove all the epics
        if (issue.fields?.issuetype?.name === "Epic") {
          continue;
        }

        const subIssuePayload = [];
        let modulePayload = null;
        if (issue.fields.subtasks.length > 0) {
          for (const subIssue of issue.fields.subtasks) {
            subIssuePayload.push({
              external_id: subIssue.id,
              external_source: "jira",
            });
          }
        }

        if (issue.fields.parent) {
          if (issue.fields.parent.fields.issuetype.name === "Epic") {
            modulePayload = {
              external_id: issue.fields.parent?.id,
              external_source: "jira",
              name: issue.fields.parent?.fields?.summary,
            };
          }
        }

        // issue status
        const state = issue.fields?.status && {
          external_id: issue.fields.status.id,
          external_source: "jira",
          name: issue.fields.status.name,
          group:
            EJiraStatus[
              issue.fields.status.statusCategory
                .name as keyof typeof EJiraStatus
            ],
        };

        // issue labels
        const labelList = [];
        for (const label in issue.fields.labels) {
          labelList.push({
            external_id: null,
            external_source: "jira",
            name: issue.fields.labels[label],
          });
        }

        // issue comments
        const commentsList = [];
        const commentUrl = `https://${cloud_hostname}/rest/api/3/issue/${issue.id}/comment?expand=renderedBody`;
        const commentResponse = await axios.get(commentUrl, { auth, headers });
        if (
          commentResponse &&
          commentResponse.data &&
          commentResponse.data.total
        ) {
          for await (const comment of loadComments(commentUrl, auth)) {
            commentsList.push({
              comment_html:
                comment.renderedBody === "" ? "<p></p>" : comment.renderedBody,
              email: comment.updateAuthor.emailAddress,
              external_id: comment.id,
              external_source: "jira",
            });
          }
        }

        const issuesSync = {
          args: [], // args
          kwargs: {
            data: {
              type: "issue.create",
              name: issue.fields.summary.substring(0, 250),
              description_html: issue.renderedFields?.description,
              assignees: [{ email: issue.fields?.assignee?.emailAddress }],
              state,
              priority:
                EJiraPriority[
                  issue.fields.priority?.name as keyof typeof EJiraPriority
                ],
              workspace_id,
              project_id,
              created_by_id: created_by,
              external_id: issue.id,
              external_source: "jira",
              comments: commentsList,
              target_date: issue.fields.duedate,
              link: {
                title: `Original Issue in Jira ${issue.key}`,
                url: `https://${cloud_hostname}/browse/${issue.key}`,
              },
              labels: labelList,
              parent: {
                external_id: issue.fields.parent?.id,
                external_source: "jira",
              },
              importer_id,
              sub_issues: subIssuePayload,
              module: modulePayload,
            },
          }, // kwargs
          other_data: {}, // other data
        };

        this.mq?.publish(issuesSync, `${IMPORTER_TASK_ROUTE}`);
      }


      if (epics_to_modules){
        const url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key} AND issuetype = Epic&fields=comment, issuetype, summary, description, assignee, priority, status, labels, duedate, parent, parentEpic, subtasks&maxResults=100&expand=renderedFields`;
        for await (const issue of loadIssues(url, auth)) {
          const moduleSync = {
            args: [], // args
            kwargs: {
              data: {
                type: "issue.create",
                name: issue.fields.summary.substring(0, 250),
                workspace_id,
                project_id,
                created_by_id: created_by,
                external_id: issue.id,
                external_source: "jira",
                importer_id,
              },
            }, // kwargs
            other_data: {}, // other data
          };
          this.mq?.publish(moduleSync, MODULE_TASK_ROUTE);
        }
      }

      return;
    } catch (error) {
      logger.error(error);
      const workspace_id = req.body.workspace_id;
      const project_id = req.body.project_id;
      const created_by = req.body.created_by;
      const importer_id = req.body.importer_id;
      const importSync = {
        args: [], // args
        kwargs: {
          data: {
            type: "import.create",
            reason: error,
            workspace_id: workspace_id,
            project_id: project_id,
            created_by: created_by,
            importer_id: importer_id,
            status: "failed",
          },
        }, // kwargs
        other_data: {}, // other data
      };

      this.mq?.publish(importSync, IMPORTER_STATUS_TASK_ROUTE);
    }
  }

  @Post("status")
  @Middleware([AuthKeyMiddleware])
  private async status(req: Request, res: Response) {
    try {
      const { workspace_id, total_issues, processed_issues, importer_id } =
        req.body;

      res.status(200).json({ msg: "Successfull" });

      // Send the event
      this.io.to(workspace_id).emit("status", {
        total_issues: total_issues,
        importer_id: importer_id,
        processed_issues: processed_issues,
      });

      return;
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Internal server error", error: error });
    }
  }
}
