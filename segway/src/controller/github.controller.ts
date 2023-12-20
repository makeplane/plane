// express
import { Request, Response } from "express";
// overnight js
import { Controller, Post, Middleware } from "@overnightjs/core";
// postgres
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// showdown
import showdown from "showdown";
// octokit
import { Octokit } from "octokit";
import { getOctokit } from "../utils/github.authentication";
// logger
import { logger } from "../utils/logger";
// mq
import { MQSingleton } from "../mq/singleton";
// middleware
import AuthKeyMiddleware from "../middleware/authkey.middleware";

@Controller("api/github")
export class GithubController {
  /**
   * This controller houses all routes for the Github Importer/Integration
   */
  // Initialize database and mq
  db: PostgresJsDatabase;
  mq: MQSingleton;
  constructor(db: PostgresJsDatabase, mq: MQSingleton) {
    this.db = db;
    this.mq = mq;
  }

  private getAllEntities = async (
    octokit: Octokit,
    requestPath: string,
    requestParams: any
  ) => {
    let page = 1;
    let results;

    const returnData = [];

    do {
      results = await octokit.request(requestPath, { ...requestParams, page });
      returnData.push(...results.data);
      page++;
    } while (results.data.length !== 0);

    return returnData;
  };

  private githubCommentCreator = (
    issue_number: number,
    comments: { [key: string]: any }[]
  ) => {
    const bulk_comments: { [key: string]: string | number }[] = [];
    const converter = new showdown.Converter({ optionKey: "value" });

    comments.forEach((comment) => {
      if (
        parseInt(
          comment.issue_url.substring(comment.issue_url.lastIndexOf("/") + 1)
        ) === issue_number
      ) {
        bulk_comments.push({
          external_id: comment.id,
          external_source: "github",
          comment_html:
            comment.body === null
              ? "<p></p>"
              : converter.makeHtml(comment.body),
        });
      }
    });

    return bulk_comments;
  };

  private githubLabelCreator = (
    issue_number: number,
    labels: (string | { [key: string]: any })[]
  ) => {
    const issueLabels: { [key: string]: string | number }[] = [];

    labels.forEach((label) =>
      issueLabels.push({
        name: typeof label === "object" && label !== null ? label.name : label,
      })
    );

    return issueLabels;
  };

  @Post("")
  @Middleware([AuthKeyMiddleware])
  private async home(req: Request, res: Response) {
    try {
      const { owner, repo, installationId } = req.body;

      // Get the octokit instance
      const octokit = await getOctokit(installationId);

      // Fetch open issues
      const openIssuesResponse = await octokit.request("GET /search/issues", {
        q: `repo:${owner}/${repo} type:issue state:open`,
      });
      const openIssuesCount = openIssuesResponse.data.total_count;

      // Fetch closed issues
      const closedIssuesResponse = await octokit.request("GET /search/issues", {
        q: `repo:${owner}/${repo} type:issue state:closed`,
      });
      const closedIssuesCount = closedIssuesResponse.data.total_count;

      // Calculate total issues
      const totalIssues = openIssuesCount + closedIssuesCount;

      // Fetch total labels count
      const labels = await this.getAllEntities(
        octokit,
        "GET /repos/{owner}/{repo}/labels",
        { owner, repo }
      );

      // Fetch total collaborators count
      const collaborators = await this.getAllEntities(
        octokit,
        "GET /repos/{owner}/{repo}/collaborators",
        { owner, repo }
      );

      const labelCount = labels.length;

      return res.status(200).json({
        issue_count: totalIssues,
        labels: labelCount,
        collaborators,
      });
    } catch (error) {
      logger.error(error);
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }

  @Post("metadata")
  @Middleware([AuthKeyMiddleware])
  private async metadata(req: Request, res: Response) {
    try {
      const { installationId } = req.body;

      // Get the octokit instance
      const octokit = await getOctokit(installationId);

      const { data } = await octokit.request("GET /app", {
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      return res.status(200).json(data);
    } catch (error) {
      logger.error(error);
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }

  @Post("repos")
  @Middleware([AuthKeyMiddleware])
  private async repos(req: Request, res: Response) {
    try {
      const { installationId, page } = req.body;

      // Get the octokit instance
      const octokit = await getOctokit(installationId);

      const { data } = await octokit.request("GET /installation/repositories", {
        q: `page=${page}`,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      return res.status(200).json(data);
    } catch (error) {
      logger.error(error);
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }

  @Post("import")
  @Middleware([AuthKeyMiddleware])
  private async import(req: Request, res: Response) {
    const {
      metadata: { owner, name: repo },
      data: { users },
      config: { installation_id, sync },
      workspace_id,
      project_id,
      created_by,
      importer_id,
    } = req.body;

    try {
      res.status(200).json({
        message: "Successful",
      });

      // Get the octokit instance
      const octokit = await getOctokit(installation_id);

      // Markdown converter
      const converter = new showdown.Converter({ optionKey: "value" });

      // users
      const members = [];
      for (const user of users) {
        if (user?.import == "invite" || user?.import == "map") {
          const githubMembers = {
            args: [], // args
            kwargs: {
              data: {
                type: "member.sync",
                email: user.email,
                workspace_id: workspace_id,
                project_id: project_id,
                created_by_id: created_by,
              },
            }, // kwargs
            other_data: {}, // other data
          };
          members.push(user);
          this.mq?.publish(
            githubMembers,
            "plane.bgtasks.importer_task.import_task"
          );
        }
      }

      // Labels
      const githubLabels = await octokit.paginate(
        octokit.rest.issues.listLabelsForRepo,
        {
          owner: owner,
          repo: repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
          per_page: 100,
        }
      );
      for await (const label of githubLabels) {
        const labelSync = {
          args: [], // args
          kwargs: {
            data: {
              type: "label.sync",
              external_source: "github",
              external_id: label.id,
              color: `#${label.color}`,
              name: label.name,
              workspace_id: workspace_id,
              project_id: project_id,
              created_by_id: created_by,
            },
          }, // kwargs
          other_data: {}, // other data
        };
        this.mq?.publish(labelSync, "plane.bgtasks.importer_task.import_task");
      }

      // Issues
      const githubIssues = await octokit.paginate(
        octokit.rest.issues.listForRepo,
        {
          state: "all",
          owner: owner,
          repo: repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
          per_page: 100,
          sort: "created",
          direction: "asc",
        }
      );

      // Issue comments
      const comments = [];
      const githubComments = await octokit.paginate(
        octokit.rest.issues.listCommentsForRepo,
        {
          owner: owner,
          repo: repo,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
          per_page: 100,
        }
      );
      for await (const comment of githubComments) {
        comments.push(comment);
      }

      for await (const issue of githubIssues) {
        if (!("pull_request" in issue)) {
          const description_html = await converter.makeHtml(
            issue?.body_html || "<p><p>"
          );

          const issueSync = {
            args: [], // args
            kwargs: {
              data: {
                type: "issue.sync",
                name: issue.title,
                description_html: description_html,
                state: issue.state,
                workspace_id: workspace_id,
                project_id: project_id,
                created_by_id: created_by,
                external_id: issue.id,
                external_source: "github",
                link: {
                  title: `Original Issue in Github ${issue.number}`,
                  url: issue.html_url,
                },
                parent_id: null,
              },
            },
          };
          // Push the issue
          this.mq?.publish(issueSync, "plane.bgtasks.importer_task.import_task");

          // Push the comments
          const githubIssueComments = this.githubCommentCreator(
            issue.number,
            comments
          );

          githubIssueComments.forEach((githubIssueComment) => {
            const commentSync = {
              args: [],
              kwargs: {
                data: {
                  type: "issue.comment.sync",
                  comment_html: githubIssueComment.comment_html,
                  external_source: githubIssueComment.external_source,
                  external_id: githubIssueComment.external_id,
                  external_issue_id: issue.id,
                  external_issue_source: "github",
                  workspace_id: workspace_id,
                  project_id: project_id,
                  created_by_id: created_by,
                },
              },
            };
            // push to queue
            this.mq?.publish(
              commentSync,
              "plane.bgtasks.importer_task.import_task"
            );
          });

          // Push the labels
          const githubLabels = this.githubLabelCreator(
            issue.number,
            issue.labels
          );
          githubLabels.forEach((githubLabel) => {
            const labelSync = {
              args: [],
              kwargs: {
                data: {
                  type: "issue.label.sync",
                  name: githubLabel.name,
                  external_issue_id: issue.id,
                  external_issue_source: "github",
                  workspace_id: workspace_id,
                  project_id: project_id,
                  created_by_id: created_by,
                },
              },
            };
            //Push to queue
            this.mq?.publish(
              labelSync,
              "plane.bgtasks.importer_task.import_task"
            );
          });
        }
      }

      const import_sync = {
        args: [], // args
        kwargs: {
          data: {
            type: "import.sync",
            workspace_id: workspace_id,
            project_id: project_id,
            created_by_id: created_by,
            importer_id: importer_id,
            status: "completed",
          },
        }, // kwargs
        other_data: {}, // other data
      };

      this.mq?.publish(import_sync, "plane.bgtasks.importer_task.import_task");

      return;
    } catch (error) {
      logger.error(error);
      const import_sync = {
        args: [], // args
        kwargs: {
          data: {
            type: "import.sync",
            workspace_id: workspace_id,
            project_id: project_id,
            created_by_id: created_by,
            importer_id: importer_id,
            status: "failed",
          },
        }, // kwargs
        other_data: {}, // other data
      };

      this.mq?.publish(import_sync, "plane.bgtasks.importer_task.import_task");
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }
}
