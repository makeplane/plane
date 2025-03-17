import type { Request, Response, Router } from "express";
import { Controller, Get } from "@/lib/decorators";
import { IController } from "@/lib/controller.interface";

@Controller("/health")
export class HealthController implements IController {
  @Get("/")
  async healthCheck(_req: Request, res: Response) {
    res.status(200).json({ status: "OK" });
  }

  registerRoutes(router: Router): void {
    // Routes are registered via decorators
  }
}
