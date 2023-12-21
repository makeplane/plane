// overnight js
import { Request, Response } from "express";
import { Controller, Post, Middleware } from "@overnightjs/core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// mq
import { MQSingleton } from "../mq/singleton";
// middleware
import AuthKeyMiddleware from "../middleware/authkey.middleware";
// axios
import axios, { AxiosResponse } from "axios";

import { loadIssues, loadComments } from "../utils/paginator";
import { EJiraPriority, EJiraStatus } from "../utils/constant";

const IMPORTER_TASK_ROUTE = "plane.bgtasks.importer_task.import_sync";

@Controller("api/jira")
export class JiraController {
  /**
   * This controller houses all routes for the Jira Importer
   */

  // Initialize database and mq
  db: PostgresJsDatabase;
  mq: MQSingleton;
  constructor(db: PostgresJsDatabase, mq: MQSingleton) {
    this.db = db;
    this.mq = mq;
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
      const issueUrl = `https://${cloud_hostname}/rest/api/3/search?jql=project=${project_key}`;
      const moduleUrl = `https://${cloud_hostname}/rest/api/3/search?jql=project=${project_key}`;
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

      res.status(200).json({
        issues: issuesTotal,
        modules: modulesTotal,
        labels: labelsTotal,
        states: statusCount,
        users: usersData,
      });

      return;
    } catch (error) {
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }

  @Post("import")
  @Middleware([AuthKeyMiddleware])
  private async import(req: Request, res: Response) {
    try {
      res.status(200).json({
        message: "Successful",
      });

      const {
        metadata,
        workspace_id,
        project_id,
        created_by,
        importer_id,
        users,
      } = req.body;
      const { email, api_token, project_key, cloud_hostname } = metadata;

      const auth = {
        username: email,
        password: api_token,
      };

      const headers = {
        Accept: "application/json",
      };

      // const url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key}`;
      const url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key}&fields=comment, issuetype, summary, description, assignee, priority, status, labels, duedate, parent, parentEpic, subtasks&maxResults=100&expand=renderedFields`;

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
          // if (issue.fields.issuetype?.name === "Subtask") {
          //   subIssuePayload.push({
          //     external_id: issue.id,
          //     external_source: "jira",
          //   });
          // }
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
        // accountId: '712020:1012e7d7-002f-4b08-91e2-1f64816733a8'

        // const accountId = issue.fields.assignee?.accountId;
        // const colonIndex = accountId.indexOf(':');
        // if (colonIndex !== -1) {
        //   const numberAfterColon = accountId.slice(colonIndex + 1);
        //     const userUrl = `https://${cloud_hostname}/rest/api/3/user?accountId=${numberAfterColon}`;
        //     const userResponse = await axios.get(userUrl, { auth, headers });
        //     console.log(userResponse.data, "userresponse");

        //   // console.log(numberAfterColon); // This will output '1012e7d7-002f-4b08-91e2-1f64816733a8'
        // }
        // console.log(issue.fields.assignee, "assignee")
        // const userUrl = `https://${cloud_hostname}/rest/api/3/user?accountId=${issue.fields.assignee?.accountId}`;
        // const userResponse = await axios.get(userUrl, { auth, headers });
        // console.log(userResponse.data, "userresponse");

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
              assignee: issue.fields?.assignee?.emailAddress,
              state,
              priority:
                EJiraPriority[
                  issue.fields.priority?.name as keyof typeof EJiraPriority
                ],
              workspace_id,
              project_id,
              created_by,
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
              sub_issue: subIssuePayload,
              module: modulePayload,
            },
          }, // kwargs
          other_data: {}, // other data
        };

        this.mq?.publish(issuesSync, `${IMPORTER_TASK_ROUTE}`);
      }

      // import sync
      const importSync = {
        args: [], // args
        kwargs: {
          data: {
            type: "import.create",
            workspace_id: workspace_id,
            project_id: project_id,
            created_by: created_by,
            importer_id: importer_id,
            status: "completed",
          },
        }, // kwargs
        other_data: {}, // other data
      };

      // this.mq?.publish(importSync, `${IMPORTER_TASK_ROUTE}`);

      return;
    } catch (error) {
      const workspace_id = req.body.workspace_id;
      const project_id = req.body.project_id;
      const created_by = req.body.created_by;
      const importer_id = req.body.importer_id;
      const importSync = {
        args: [], // args
        kwargs: {
          data: {
            type: "import.create",
            workspace_id: workspace_id,
            project_id: project_id,
            created_by: created_by,
            importer_id: importer_id,
            status: "failed",
          },
        }, // kwargs
        other_data: {}, // other data
      };

      // this.mq?.publish(importSync, `${IMPORTER_TASK_ROUTE}`);

      return res.json({ message: "Server error", error: error });
    }
  }
}
