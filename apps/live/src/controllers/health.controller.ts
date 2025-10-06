import type { Request, Response } from "express";
import { Controller, Get } from "@plane/decorators";
import { env } from "@/env";

@Controller("/health")
export class HealthController {
  @Get("/")
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
    });
  }
}
