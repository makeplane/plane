import type { Request, Response } from "express";
import { Controller, Get, CatchErrors } from "@/lib/decorators";
import { BaseController } from "@/lib/base.controller";

@Controller("/health")
export class HealthController extends BaseController {
  @Get("/")
  @CatchErrors()
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({ 
      status: "OK",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0'
    });
  }
}
