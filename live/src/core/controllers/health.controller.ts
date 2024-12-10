import { Router, Request, Response } from "express";
import type { Hocuspocus as HocusPocusServer } from "@hocuspocus/server";

export class HealthController {
  constructor(private hocusPocusServer: HocusPocusServer) {
    this.hocusPocusServer = hocusPocusServer;
  }

  registerRoutes(router: Router) {
    router.get("/health", this.healthCheck);
  }

  private healthCheck(_req: Request, res: Response) {
    res.status(200).json({ status: "OK" });
  }
}
