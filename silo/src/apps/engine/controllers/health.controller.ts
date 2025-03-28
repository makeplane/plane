import { Request, Response } from "express";
import { Controller, Get } from "@/lib";
import { responseHandler } from "@/helpers/response-handler";
import { getAPIClient } from "@/services/client";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";

const apiClient = getAPIClient();

@Controller("/health")
export class HomeController {
  @Get("/")
  async HomePingRequest(req: Request, res: Response) {
    try {
      res.status(201).json({ message: "Welcome to Silo health check" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/check-hmac")
  async ApiPingRequest(req: Request, res: Response) {
    try {
      await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITHUB,
      });
      res.status(201).json({ message: "Welcome to Silo API health check" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }
}
