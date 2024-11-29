import { Controller, Delete, Get, Post } from "@/lib";
import {
  createOrUpdateCredentials,
  deactivateCredentials,
  getCredentialsByWorkspaceId,
  verifyAndUpdateTargetToken,
} from "@/db/query";
import { Request, Response } from "express";
import { env } from "@/env";

@Controller("/api/credentials")
export class CredentialController {
  @Post("/:workspaceId/:userId")
  async upsertCredentials(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;
      const credential = await createOrUpdateCredentials(workspaceId, userId, {
        workspace_id: req.params.workspaceId,
        ...req.body,
      });
      res.status(200).json(credential);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/:workspaceId/:userId/")
  async getCredentials(req: Request, res: Response) {
    try {
      // Get the workspaceId from the request params
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;
      const source = req.query.source as string;
      // Fetch all the credentials
      const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, source);

      let isOAuthEnabled = true;

      if (source.toLowerCase() === "linear") {
        isOAuthEnabled = env.LINEAR_OAUTH_ENABLED === "1";
      } else if (source.toLowerCase() === "jira") {
        isOAuthEnabled = env.JIRA_OAUTH_ENABLED === "1";
      } else if (source.toLowerCase() === "asana") {
        isOAuthEnabled = env.ASANA_OAUTH_ENABLED === "1";
      }

      if (!credentials || credentials.length === 0) {
        return res.status(401).json({ isAuthenticated: false, isOAuthEnabled: isOAuthEnabled });
      }

      return res.status(200).json({ isAuthenticated: true, isOAuthEnabled: isOAuthEnabled });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Deactivate credentials
  @Post("/:workspaceId/:userId/token-verify/")
  async externalApiTokenVerification(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      const source = req.query.source as string;
      const token = req.query.token as string;

      if (!source) return res.status(400).json({ error: "Source is not provided" });
      if (!token) return res.status(400).json({ error: "Token is not provided" });

      // Deactivate credentials
      await verifyAndUpdateTargetToken(workspaceId, userId, source, token);

      res.status(200).json({ message: "Successfully verified." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Deactivate credentials
  @Post("/:workspaceId/:userId/deactivate/")
  async unsetCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      const source = req.query.source as string;

      if (!source) {
        return res.status(400).json({ error: "Source is not provided" });
      }

      // Deactivate credentials
      await deactivateCredentials(workspaceId, userId, source);

      res.status(200).json({ message: "Credentials deactivated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
