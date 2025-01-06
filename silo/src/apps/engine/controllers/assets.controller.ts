
import { Request, Response } from "express";
import { getCredentialsById, getCredentialsByWorkspaceId } from "@/db/query";
import { Controller, Delete, Get, Post } from "@/lib";
import { Client } from "@plane/sdk";
import { env } from "@/env";
import { getWorkspaceConnectionByCredentialsId } from "@/db/query/connection";

@Controller("/api/assets")
export class AssetsController {

  @Get("/:source/:workspaceId/:userId/:id")
  async getAsset(req: Request, res: Response) {
    try {
      // Verify the params are present
      const { workspaceId, userId, id, source } = req.params;
      if (!workspaceId || !userId || !id || !source) {
        return res.status(400).send("Missing required parameters");
      }

      // Get the credentials for the workspace
      const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, source.toUpperCase())
      if (!credentials || credentials.length === 0) {
        return res.status(401).send("No credentials found for the workspace");
      }

      const credential = credentials[0];
      if (!credential.target_access_token) {
        return res.status(401).send("No target access token found for the workspace");
      }

      const workspaceConnections = await getWorkspaceConnectionByCredentialsId(credential.id);
      if (!workspaceConnections || workspaceConnections.length === 0) {
        return res.status(401).send("No workspace connection found for the workspace");
      }

      const workspaceConnection = workspaceConnections[0];

      // Create Plane Client, with the help of the recieved token
      const planeClient = new Client({
        baseURL: env.API_BASE_URL,
        apiToken: credential.target_access_token
      })

      // Get the presigned url for the asset
      const asset = await planeClient.assets.getAssetInfo(workspaceConnection.workspaceSlug, id)
      return res.status(302).redirect(asset.asset_url);

    } catch (error: any) {
      console.log(error);
      return res.status(500).send(error.message);
    }
  }
}
