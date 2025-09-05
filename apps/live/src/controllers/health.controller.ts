import type { Request, Response } from "express";
import { Controller, Get } from "@plane/decorators";

@Controller("/health")
export class HealthController {
  @Get("/")
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
    });
  }
}
