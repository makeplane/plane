import { responseHandler } from "@/helpers/response-handler";
import { Controller, Delete, Get, Post, useValidateUserAuthentication } from "@/lib";
import { getAPIClient } from "@/services/client";
import { Request, Response } from "express";

const apiClient = getAPIClient();

@Controller("/api/connections")
export class ConnectionsController {
  @Get("/workspace/:workspaceId")
  @useValidateUserAuthentication()
  async getWorkspaceConnections(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { type, connectionId } = req.query;
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        workspace_id: workspaceId,
        connection_type: type as string | undefined,
        connection_id: connectionId as string | undefined,
      });
      res.status(200).json(connections);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:workspaceId/user/:userId")
  @useValidateUserAuthentication()
  async getUserConnections(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      const userConnections = await apiClient.workspaceConnection.getWorkspaceUserConnections(workspaceId, userId);
      res.status(200).json(userConnections);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/workspace/:workspaceId")
  @useValidateUserAuthentication()
  async createWorkspaceConnections(req: Request, res: Response) {
    try {
      // Get the credentials for the workspace and user for the source
      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: req.body.source,
        workspace_id: req.params.workspaceId,
        user_id: req.body.userId,
      });

      if (!credentials || credentials.length === 0) {
        return res.status(400).json({ error: "Credentials not found" });
      }

      // If credentials are present then create the connection
      const connection = await apiClient.workspaceConnection.createWorkspaceConnection({
        connection_id: req.body.connectionId,
        connection_data: req.body.connectionData,
        workspace_id: req.params.workspaceId,
        connection_type: req.body.source,
        target_hostname: req.body.targetHost,
        config: req.body.config,
        credential_id: credentials[0].id,
      });
      res.status(201).json(connection);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Delete("/workspace/:id")
  @useValidateUserAuthentication()
  async deleteWorkspaceConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedConnection = await apiClient.workspaceConnection.deleteWorkspaceConnection(id);
      res.status(200).json(deletedConnection);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/entity")
  @useValidateUserAuthentication()
  async createEntityConnection(req: Request, res: Response) {
    try {
      const connection = await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection(req.body);
      res.status(201).json(connection);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/entity/:id")
  @useValidateUserAuthentication()
  async getEntityConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await apiClient.workspaceEntityConnection.getWorkspaceEntityConnection(id);
      if (connection) {
        res.status(200).json(connection);
      } else {
        res.status(404).json({ error: "Entity connection not found" });
      }
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/entity/byEntityId/:entityId")
  @useValidateUserAuthentication()
  async getEntityConnectionByEntityId(req: Request, res: Response) {
    try {
      const { entityId } = req.params;
      const connection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        entity_id: entityId,
      });
      if (connection) {
        res.status(200).json(connection);
      } else {
        res.status(404).json({ error: "Entity connection not found" });
      }
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/entity/:workspaceId/:projectId?")
  @useValidateUserAuthentication()
  async getEntityConnectionByWorkspaceAndProjectId(req: Request, res: Response) {
    try {
      const { workspaceId, projectId } = req.params;
      const connections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_id: workspaceId,
        project_id: projectId,
      });
      res.status(200).json(connections);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/entity/:workspaceId/:projectId/all")
  @useValidateUserAuthentication()
  async getAllEntityConnections(req: Request, res: Response) {
    try {
      const { workspaceId, projectId } = req.params;
      const connections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_id: workspaceId,
        project_id: projectId,
      });
      res.status(200).json(connections);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/entity/:id")
  @useValidateUserAuthentication()
  async updateEntityConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedConnection = await apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(id, req.body);
      res.status(200).json(updatedConnection);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Delete("/entity/:id")
  @useValidateUserAuthentication()
  async deleteEntityConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedConnection = await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(id);
      res.status(200).json(deletedConnection);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }
}
