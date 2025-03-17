import type { Request, Response } from "express";
import { Controller, Get } from "@/lib/decorators";
import { BaseController } from "@/lib/base.controller";

@Controller("/health")
export class HealthController extends BaseController {
  @Get("/")
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({ status: "OK" });
  }
}
