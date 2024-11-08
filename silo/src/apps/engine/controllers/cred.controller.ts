import { Controller, Get, Post } from "@/lib";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId } from "@/db/query";
import { Request, Response } from "express";

@Controller("/credentials")
export class CredentialController {
  @Post("/:workspaceId/:userId")
  async upsertCredentials(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;
      const userId = req.params.userId;

      if (!workspaceId || !userId) {
        return res.status(400).json({ error: "Either workspaceId or userId is not provided" });
      }

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

      if (!workspaceId || !userId) {
        return res.status(400).json({ error: "Either workspaceId or userId is not provided" });
      }

      const source = req.query.source as string;
      // Fetch all the credentials
      const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, source);

      if (!credentials || credentials.length === 0) {
        return res.status(401).json({ isAuthenticated: false });
      }
      return res.status(200).json({ isAuthenticated: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
