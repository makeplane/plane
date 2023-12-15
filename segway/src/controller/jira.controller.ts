// overnight js
import { Request, Response } from "express";
import { Controller, Post, Middleware } from "@overnightjs/core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// mq
import { MQSingleton } from "../mq/singleton";
// middleware
import AuthKeyMiddlware from "../middleware/authkey.middleware";

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
  @Middleware([AuthKeyMiddlware])
  private home(req: Request, res: Response) {
    try {
      res.status(200).json({ message: "Hello, Plane Users" });

      // Process Jira message
      const body = {
        args: [], // args
        kwargs: {
          data: {
            type: "issue.create",
            data: {
              message: "Segway say's Hi",
            },
          },
        }, // kwargs
        other_data: {}, // other data
      };

      this.mq?.publish(body, "plane.bgtasks.issue_sync_task.issue_sync");
      return;
    } catch (error) {
      return res.json({ message: "Server error" });
    }
  }
}
