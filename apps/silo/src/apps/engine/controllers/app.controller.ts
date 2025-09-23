import { Request, Response } from "express";
import { E_IMPORTER_KEYS, E_INTEGRATION_KEYS, TAppKeys } from "@plane/etl/core";
import { getSupportedIntegrations } from "@/helpers/app";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Get } from "@/lib";

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

  @Get("/plane-app-details/:provider")
  async getPlaneAppDetails(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      if (
        !Object.values([E_IMPORTER_KEYS.IMPORTER, ...Object.values(E_INTEGRATION_KEYS)].flat()).includes(
          provider as TAppKeys
        )
      ) {
        throw new Error("Invalid provider");
      }

      const { planeAppId, planeAppClientId } = await getPlaneAppDetails(provider as TAppKeys);
      res.status(200).json({
        appId: planeAppId,
        clientId: planeAppClientId,
      });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }
}
