import { CatchErrors } from "@/lib/decorators";
import { Controller, Get } from "@plane/decorators";
import type { Request, Response } from "express";

@Controller("/health")
export class HealthController {
  @Get("/")
  @CatchErrors()
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "1.0.0",
    });
  }
}
