import { Request, Response } from "express";
import { Controller, Get, Post } from "@plane/decorators";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { validateImporterCredentials } from "@/apps/jira-importer/helpers/controller-helpers";
import { responseHandler } from "@/helpers/response-handler";
import { useValidateUserAuthentication } from "@/lib/decorators";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

@Controller("/api/credentials")
export class CredentialController {
  @Post("/:workspaceId/:userId")
  @useValidateUserAuthentication()
  async upsertCredentials(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;

      const credential = await apiClient.workspaceCredential.createWorkspaceCredential({
        workspace_id: workspaceId,
        user_id: userId,
        ...req.body,
      });
      res.status(200).json(credential);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:workspaceId/:userId/")
  @useValidateUserAuthentication()
  async getCredentials(req: Request, res: Response) {
    try {
      // Get the workspaceId from the request params
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;
      const source = req.query.source as string;

      const validationResult = await validateImporterCredentials(
        apiClient,
        workspaceId,
        userId,
        source as E_IMPORTER_KEYS
      );
      return res.status(200).json(validationResult);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:workspaceId/:userId/token-verify/")
  @useValidateUserAuthentication()
  async externalApiTokenVerification(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      const source = req.query.source as string;
      const token = req.query.token as string;

      if (!source) return res.status(400).json({ error: "Source is not provided" });
      if (!token) return res.status(400).json({ error: "Token is not provided" });

      await apiClient.workspaceCredential.verifyWorkspaceCredentials(source, userId, workspaceId);

      res.status(200).json({ message: "Successfully verified." });
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:workspaceId/:userId/deactivate/")
  @useValidateUserAuthentication()
  async unsetCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      const source = req.query.source as string;

      if (!source) {
        return res.status(400).json({ error: "Source is not provided" });
      }

      // Deactivate credentials
      const [credential] = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source,
        workspace_id: workspaceId,
        user_id: userId,
      });

      await apiClient.workspaceCredential.deleteWorkspaceCredential(credential.id);

      res.status(200).json({ message: "Credentials deactivated successfully" });
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }
}
