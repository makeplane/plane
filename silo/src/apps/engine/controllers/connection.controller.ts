import { getCredentialsByWorkspaceId } from "@/db/query";
import {
  createEntityConnection,
  createWorkspaceConnection,
  deleteEntityConnection,
  deleteWorkspaceConnection,
  getAllEntityConnections,
  getEntityConnection,
  getEntityConnectionByEntityId,
  getEntityConnectionByWorkspaceAndProjectId,
  getWorkspaceConnections,
  updateEntityConnection,
} from "@/db/query/connection";
import { Controller, Delete, Get, Post } from "@/lib";
import { Request, Response } from "express";
import z from "zod";

const createWorkspaceConnectionSchema = z.object({
  source: z.string(),
  workspaceSlug: z.string(),
  targetHost: z.string(),
  userId: z.string(),
  config: z.object({}),

  connectionId: z.string(),
  connectionData: z.object({}),
});

@Controller("/api/connections")
export class ConnectionsController {
  @Get("/workspace/:workspaceId")
  async getWorkspaceConnections(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { type, connectionId } = req.query;
      const connections = await getWorkspaceConnections(
        workspaceId,
        type as string | undefined,
        connectionId as string | undefined
      );
      res.status(200).json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post("/workspace/:workspaceId")
  async createWorkspaceConnections(req: Request, res: Response) {
    try {
      let payload: z.infer<typeof createWorkspaceConnectionSchema>;

      // Perform schema validation for the types
      try {
        payload = createWorkspaceConnectionSchema.parse(req.body);
      } catch (error: any) {
        return res.status(400).json({ error: error });
      }

      // Get the credentials for the workspace and user for the source
      const credentials = await getCredentialsByWorkspaceId(req.params.workspaceId, payload.userId, payload.source);

      if (!credentials || credentials.length === 0) {
        return res.status(400).json({ error: "Credentials not found" });
      }

      // If credentials are present then create the connection
      const connection = await createWorkspaceConnection({
        connectionId: payload.connectionId,
        connectionData: payload.connectionData,
        workspaceSlug: payload.workspaceSlug,
        workspaceId: req.params.workspaceId,
        connectionType: payload.source,
        targetHostname: payload.targetHost,
        config: payload.config,
        credentialsId: credentials[0].id,
      });

      res.status(201).json(connection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Delete("/workspace/:id")
  async deleteWorkspaceConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedConnection = await deleteWorkspaceConnection(id);
      res.status(200).json(deletedConnection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post("/entity")
  async createEntityConnection(req: Request, res: Response) {
    try {
      const connection = await createEntityConnection(req.body);
      res.status(201).json(connection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/entity/:id")
  async getEntityConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await getEntityConnection(id);
      if (connection) {
        res.status(200).json(connection);
      } else {
        res.status(404).json({ error: "Entity connection not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/entity/byEntityId/:entityId")
  async getEntityConnectionByEntityId(req: Request, res: Response) {
    try {
      const { entityId } = req.params;
      const connection = await getEntityConnectionByEntityId(entityId);
      if (connection) {
        res.status(200).json(connection);
      } else {
        res.status(404).json({ error: "Entity connection not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/entity/:workspaceId/:projectId?")
  async getEntityConnectionByWorkspaceAndProjectId(req: Request, res: Response) {
    try {
      const { workspaceId, projectId } = req.params;
      const connections = await getEntityConnectionByWorkspaceAndProjectId(workspaceId, projectId);
      res.status(200).json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/entity/:workspaceId/:projectId/all")
  async getAllEntityConnections(req: Request, res: Response) {
    try {
      const { workspaceId, projectId } = req.params;
      const connections = await getAllEntityConnections(workspaceId, projectId);
      res.status(200).json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post("/entity/:id")
  async updateEntityConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedConnection = await updateEntityConnection(id, req.body);
      res.status(200).json(updatedConnection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Delete("/entity/:id")
  async deleteEntityConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedConnection = await deleteEntityConnection(id);
      res.status(200).json(deletedConnection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
