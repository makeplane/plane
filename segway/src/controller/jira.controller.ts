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
      const statusUrl = `https://${cloud_hostname}/rest/api/3/status/?jql=project={project_key}`;
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
      const statusCount = statusResponse.data.length;

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
  private async JiraImport(req: Request, res: Response) {
    try {
      res.status(200).json({
        message: "Successful"
      });

      // const result = await this.db.select().from('users');
      const { email, api_token, project_key, cloud_hostname } = req.body.metadata;

      const auth = {
        username: email,
        password: api_token,
      };

      const headers = {
        Accept: "application/json",
      };

      const workspace_id = req.body.workspace_id;
      const project_id = req.body.project_id;
      const created_by = req.body.created_by;

      const users = req.body.data.users;

      // users
      let members = [];
      for (const user of users) {
        if (user?.import == "invite" || user?.import == "map") {
          const jira_members = {
            args: [], // args
            kwargs: {
              data: {
                type: "user.create",
                email: user.email,
                workspace_id: workspace_id,
                project_id: project_id,
                created_by: created_by,
              },
            }, // kwargs
            other_data: {}, // other data
          };
          members.push(user);
          this.mq?.publish(jira_members, "plane.bgtasks.importer_task.members_sync");
        }
      }

      // labels
      const labelsUrl = `https://${cloud_hostname}/rest/api/3/label/?jql=project=${project_key}`;
      const labelsResponse = await axios.get(labelsUrl, { auth, headers });
      const labels = labelsResponse.data.values;
      for (const label of labels) {
        const labelssync = {
          args: [], // args
          kwargs: {
            data: {
              type: "label.create",
              data: label,
              workspace_id: workspace_id,
              project_id: project_id,
              created_by: created_by,
            },
          }, // kwargs
          other_data: {}, // other data
        };
        this.mq?.publish(labelssync, "plane.bgtasks.importer_task.label_sync");
      }


      // states
      // const statusUrl = `https://${cloud_hostname}/rest/api/3/status/?jql=project={project_key}&expand=renderedFields`;
      // const statusUrl = `https://${cloud_hostname}/rest/api/3/project/${project_key}/statuses`;
      // const response = await axios.get(statusUrl, { auth, headers });
      // console.log(response.data)
      // for const (status of response.data) {
      //   console.log(status)
      // }
      // const states = [];

      // response?.data.forEach((status :any) => {
      //   const { statusCategory, name, id } = status;
      //   const group = statusCategory.name === "To Do" ? "unstarted" : statusCategory.name === "In Progress" ? "started" : statusCategory.name === "Done" ? "completed" : statusCategory.name;
      //   const state = name;
      //   // Check if both statusCategory.name and state are not the same
      //   if (group !== state) {
      //       states.push({ group, id, state });
      //     }
      // })
      // for (const state of states) {
      //   const statessync = {
      //     args: [], // args
      //     kwargs: {
      //       data: {
      //         type: "state.create",
      //         data: state,
      //         workspace_id: workspace_id,
      //         project_id: project_id,
      //         created_by: created_by,
      //       },

      //     }, // kwargs
      //     other_data: {}, // other data
      //   };
      //   this.mq?.publish(statessync, "plane.bgtasks.importer_task.state_sync");
      // }



      // cycles


      // modules



      // issues
      // let url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key} AND issueType=Epic OR issueType=Story OR issueType=Subtask OR issueType=Bug&fields=comment, summary, description, assignee, priority, status, labels, duedate, parent&maxResults=100&expand=renderedFields`
  
      // if (epics_to_modules) {
      // url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key} AND issueType=Story OR issueType=Subtask OR issueType=Bug&fields=comment, summary, description, assignee, priority, status, labels, duedate, parent&maxResults=100&expand=renderedFields`
      // }

      let url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key}&fields=comment, summary, description, assignee, priority, status, labels, duedate, parent&expand=renderedFields`;

      for await (const issue of loadIssues(url, auth)) {

        const user = members.find(
          (user) => user.username === issue.fields.assignee?.displayName
        );

        // issue description
        let description = "";
        if (issue.renderedFields.description) {
          description = issue.renderedFields.description;
        }
        
        // issue comments
        let comments_list = [];
        let comment_url = `https://${cloud_hostname}/rest/api/3/issue/${issue.id}/comment?expand=renderedBody`;
        const commentResponse = await axios.get(comment_url, { auth, headers });
        if (commentResponse && commentResponse.data && commentResponse.data.total) {
          for await (const comment of loadComments(comment_url, auth)) {
            comments_list.push({
              comment_html:
                comment.renderedBody === "" ? "<p></p>" : comment.renderedBody,
              created_by: comment.updateAuthor.emailAddress,
            });
          }
        }

        const issuessync = {
          args: [], // args
          kwargs: {
            data: {
              type: "issue.create",
              name: issue.fields.summary.substring(0, 250),
              description_html: description,
              assignee: user?.email,
              // state: issue.fields.status.name.toLowerCase(),
              state: false,
              priority: issue.fields.priority.name.toLowerCase() === 'medium' ? 'medium' : issue.fields.priority.name.toLowerCase() === 'highest' ? 'high' : 'low',
              workspace_id: workspace_id,
              project_id: project_id,
              created_by: created_by,
              external_id: issue.id,
              external_source: "jira",
              comments_list: comments_list,
              target_date: issue.fields.duedate,
              link: {
                  title: `Original Issue in Jira ${issue.key}`,
                  url: `https://${cloud_hostname}/browse/${issue.key}`
              },
              labels_list: issue.fields.labels,
            },
          },
        };
        this.mq?.publish(issuessync, "plane.bgtasks.importer_task.issue_sync");
      }

      return;
    } catch (error) {
      return res.json({ message: "Server error", error: error });
    }
  }
}
