import { Request, Response } from "express";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { createOrUpdateCredentials } from "@/helpers/credential";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Post, useValidateUserAuthentication } from "@/lib";

@Controller("/api/flatfile")
class CSVController {
  @useValidateUserAuthentication()
  @Post("/credentials/save")
  async saveCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, externalApiToken } = req.body;

      if (!workspaceId || !externalApiToken) {
        return res.status(400).json({
          error: "Missing required parameters: workspaceId or externalApiToken",
        });
      }

      await createOrUpdateCredentials(workspaceId, userId, E_IMPORTER_KEYS.FLATFILE, {
        source: "FLATFILE",
        target_access_token: externalApiToken,
        workspace_id: workspaceId,
        user_id: userId,
      });

      return res.sendStatus(201);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}

export default CSVController;
