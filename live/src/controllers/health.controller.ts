import type { Request, Response } from "express";
import { Controller, Get } from "../lib/decorators.js";

@Controller("/health")
export class HealthController {
  @Get("/")
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({ status: "OK" });
  }
}
