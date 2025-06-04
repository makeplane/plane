import { Request, Response } from "express";
import { getSupportedIntegrations } from "@/helpers/app";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Get } from "@/lib";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";

@Controller("/api")
export class AppController {
  @Get("/supported-integrations")
  async GetSupportedIntegrations(req: Request, res: Response) {
    try {
      const supportedIntegrations: E_INTEGRATION_KEYS[] = getSupportedIntegrations();
      res.status(200).json(supportedIntegrations);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }
}
