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
import { generatePayload } from "utils/helper";
import { EJiraStatus } from "utils/constant";

const IMPORTER_TASK_ROUTE = "plane.bgtasks.importer_task";

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
        message: "Successful",
      });

      // const result = await this.db.select().from('users');
      const { metadata, workspace_id, project_id, created_by, importer_id, users} = req.body;
      const { email, api_token, project_key, cloud_hostname } = metadata;

      const auth = {
        username: email,
        password: api_token,
      };

      const headers = {
        Accept: "application/json",
      };

      // users
      let members = [];
      for (const user of users) {
        if (user?.import === "invite" || user?.import === "map") {
          const jira_members = generatePayload({
            type: "user.create",
            email: user.email,
            workspace_id,
            project_id,
            created_by,
            importer_id,
          });
          members.push(user);
          this.mq?.publish(jira_members, `${IMPORTER_TASK_ROUTE}.members_sync`);
        }
      }

      // labels
      const labelsUrl = `https://${cloud_hostname}/rest/api/3/label/?jql=project=${project_key}`;
      const labelsResponse = await axios.get(labelsUrl, { auth, headers });
      const labels = labelsResponse.data.values;
      for (const label of labels) {
        const labelsSync = generatePayload({
          type: "label.create",
          data: label,
          workspace_id,
          project_id,
          created_by,
          importer_id,
        });
        this.mq?.publish(labelsSync, `${IMPORTER_TASK_ROUTE}.label_sync`);
      }

      // states
      const statusUrl = `https://${cloud_hostname}/rest/api/3/project/${project_key}/statuses`;
      const response = await axios.get(statusUrl, { auth, headers });

      if (response && response.data && response.data.length) {
        const statusData = response.data[0];
        if (statusData && statusData.statuses) {
          for (const statusCategory of statusData.statuses) {
            const state_name = statusCategory.name;
            const state_group =
              EJiraStatus[
                statusCategory.statusCategory.name as keyof typeof EJiraStatus
              ];
            const statesSync = generatePayload({
              type: "state.create",
              state_name,
              state_group,
              workspace_id,
              project_id,
              created_by,
              external_id: statusCategory.id,
              external_source: "jira",
              importer_id,
            });
            this.mq?.publish(statesSync, `${IMPORTER_TASK_ROUTE}.state_sync`);
          }
        }
      }

      const modules = [];
      const child_issues = [];
      const module_issues = [];

      let url = `https://${cloud_hostname}/rest/api/3/search/?jql=project=${project_key}&fields=comment, issuetype, summary, description, assignee, priority, status, labels, duedate, parent, parentEpic&maxResults=100&expand=renderedFields`;

      for await (const issue of loadIssues(url, auth)) {
        if (issue.fields.parent) {
          if (issue.fields.parent?.fields?.issuetype?.name === "Epic") {
            module_issues.push({
              issue_id: issue.id,
              module_id: issue.fields.parent?.id,
            });
          } else {
            // skipping all the child issues
            child_issues.push(issue);
            continue;
          }
        }

        // skipping all the epics
        if (issue.fields.issuetype.name === "Epic") {
          modules.push(issue);
          continue;
        }

        const user = members.find(
          (user) => user.username === issue.fields.assignee?.displayName
        );

        // issue comments
        let comments_list = [];
        let comment_url = `https://${cloud_hostname}/rest/api/3/issue/${issue.id}/comment?expand=renderedBody`;
        const commentResponse = await axios.get(comment_url, { auth, headers });
        if (
          commentResponse &&
          commentResponse.data &&
          commentResponse.data.total
        ) {
          for await (const comment of loadComments(comment_url, auth)) {
            comments_list.push({
              comment_html:
                comment.renderedBody === "" ? "<p></p>" : comment.renderedBody,
              created_by: comment.updateAuthor.emailAddress,
            });
          }
        }

        const issuesSync = generatePayload({
          type: "issue.create",
          name: issue.fields.summary.substring(0, 250),
          description_html: issue.renderedFields.description ?? null,
          assignee: user?.email,
          state: issue.fields.status.name,
          priority:
            issue.fields.priority.name.toLowerCase() === "medium"
              ? "medium"
              : issue.fields.priority.name.toLowerCase() === "highest"
                ? "high"
                : "low",
          workspace_id,
          project_id,
          created_by,
          external_id: issue.id,
          external_source: "jira",
          comments_list: comments_list,
          target_date: issue.fields.duedate,
          link: {
            title: `Original Issue in Jira ${issue.key}`,
            url: `https://${cloud_hostname}/browse/${issue.key}`,
          },
          labels_list: issue.fields.labels,
          parent_id: null,
          importer_id,
        });
        this.mq?.publish(issuesSync, `${IMPORTER_TASK_ROUTE}.issue_sync`);
      }

      for (const issue of child_issues) {
        const user = members.find(
          (user) => user.username === issue.fields.assignee?.displayName
        );

        // issue comments
        let comments_list = [];
        let comment_url = `https://${cloud_hostname}/rest/api/3/issue/${issue.id}/comment?expand=renderedBody`;
        const commentResponse = await axios.get(comment_url, { auth, headers });
        if (
          commentResponse &&
          commentResponse.data &&
          commentResponse.data.total
        ) {
          for await (const comment of loadComments(comment_url, auth)) {
            comments_list.push({
              comment_html:
                comment.renderedBody === "" ? "<p></p>" : comment.renderedBody,
              created_by: comment.updateAuthor.emailAddress,
            });
          }
        }

        const issuesSync = generatePayload({
          type: "issue.create",
          name: issue.fields.summary.substring(0, 250),
          description_html: issue.renderedFields?.description,
          assignee: user?.email,
          state: issue.fields.status.name,
          priority:
            issue.fields.priority.name.toLowerCase() === "medium"
              ? "medium"
              : issue.fields.priority.name.toLowerCase() === "highest"
                ? "high"
                : "low",
          workspace_id,
          project_id,
          created_by,
          external_id: issue.id,
          external_source: "jira",
          comments_list: comments_list,
          target_date: issue.fields.duedate,
          link: {
            title: `Original Issue in Jira ${issue.key}`,
            url: `https://${cloud_hostname}/browse/${issue.key}`,
          },
          labels_list: issue.fields.labels,
          parent_id: issue.fields.parent.id,
          importer_id,
        });
        this.mq?.publish(issuesSync, `${IMPORTER_TASK_ROUTE}.issue_sync`);
      }

      // modules
      for (const module of modules) {
        const modulesSync = generatePayload({
          type: "module.create",
          name: module.fields.summary.substring(0, 250),
          description_html: module.renderedFields?.description,
          workspace_id,
          project_id,
          created_by,
          external_id: module.id,
          external_source: "jira",
          importer_id,
        });
        this.mq?.publish(modulesSync, `${IMPORTER_TASK_ROUTE}.module_sync`);
      }

      // module issues
      for (const module_issue of module_issues) {
        const modules_issue_sync = generatePayload({
          type: "module.create",
          module_id: module_issue.module_id,
          issue_id: module_issue.issue_id,
          workspace_id,
          project_id,
          created_by,
          external_source: "jira",
          importer_id,
        });
        this.mq?.publish(
          modules_issue_sync,
          `${IMPORTER_TASK_ROUTE}.modules_issue_sync`
        );
      }

      // import sync
      const import_sync = generatePayload({
        type: "import.create",
        workspace_id: workspace_id,
        project_id: project_id,
        created_by: created_by,
        importer_id: importer_id,
        status: "completed",
      });

      this.mq?.publish(import_sync, `${IMPORTER_TASK_ROUTE}.import_sync`);

      return;
    } catch (error) {
      const workspace_id = req.body.workspace_id;
      const project_id = req.body.project_id;
      const created_by = req.body.created_by;
      const importer_id = req.body.importer_id;
      const import_sync = generatePayload({
        type: "import.create",
        workspace_id: workspace_id,
        project_id: project_id,
        created_by: created_by,
        importer_id: importer_id,
        status: "failed",
      });

      this.mq?.publish(import_sync, `${IMPORTER_TASK_ROUTE}.import_sync`);

      return res.json({ message: "Server error", error: error });
    }
  }
}
