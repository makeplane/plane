// express
import { Request, Response } from "express";
// overnight js
import { Controller, Post, Middleware } from "@overnightjs/core";
// postgres
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Octokit } from "octokit";
// octokit
import { getOctokit } from "../utils/github.authentication";
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

  private countAllPages = async (
    octokit: Octokit,
    requestPath: string,
    requestParams: any
  ) => {
    let page = 1;
    let totalCount = 0;
    let results;

    do {
      results = await octokit.request(requestPath, { ...requestParams, page });
      totalCount += results.data.length;
      page++;
    } while (results.data.length !== 0);

    return totalCount;
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
      const labelsCount = await this.countAllPages(
        octokit,
        "GET /repos/{owner}/{repo}/labels",
        { owner, repo }
      );

      // Fetch total collaborators count
      const collaboratorsCount = await this.countAllPages(
        octokit,
        "GET /repos/{owner}/{repo}/collaborators",
        { owner, repo }
      );

      res.status(200).json({
        totalIssues,
        labelsCount,
        collaboratorsCount,
      });
    } catch (error) {
      console.log(error);
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

      

      return;
    } catch (error) {
      console.log(error);
      return res.json({ message: "Server error", status: 500, error: error });
    }
  }
}
