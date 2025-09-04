import { NextFunction, Request, Response } from "express";
import { TWorkspaceEntityConnection } from "@plane/types";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Get, Post, Put, Delete, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

@Controller("/api/entity-connections")
export class EntityConnectionController {
  @Get("/:workspaceId/:workspaceConnectionId")
  @useValidateUserAuthentication()
  async getEntityConnections(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;

      if (!workspaceId || !workspaceConnectionId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, and workspaceConnectionId to be present.",
        });
      }

      const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        workspace_id: workspaceId,
      });

      return res.status(200).send(entityConnections);
    } catch (error) {
      logger.error("Failed to get entity connections:", error);
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:workspaceId/:workspaceConnectionId/:entityId")
  @useValidateUserAuthentication()
  async getEntityConnectionById(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, entityId } = req.params;

      if (!workspaceId || !workspaceConnectionId || !entityId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        workspace_id: workspaceId,
        entity_id: entityId,
      });

      return res.status(200).send(entityConnections);
    } catch (error) {
      logger.error("Failed to get entity connections:", error);
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:workspaceId/:workspaceConnectionId")
  @useValidateUserAuthentication()
  async createEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;

      if (!workspaceId || !workspaceConnectionId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const reqBody = req.body as TWorkspaceEntityConnection;

      const payload = {
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        workspace_slug: reqBody.workspace_slug,
        project_id: reqBody.project_id,
        entity_id: reqBody.entity_id,
        entity_slug: reqBody.entity_slug,
        entity_data: reqBody.entity_data,
        entity_type: reqBody.entity_type,
        config: reqBody.config,
      };

      const entityConnections = await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection(payload);
      return res.status(200).send(entityConnections);
    } catch (error) {
      logger.error("Failed to create entity connection:", error);
      return responseHandler(res, 500, error);
    }
  }

  @Put("/:workspaceId/:workspaceConnectionId/:id")
  @useValidateUserAuthentication()
  async updateEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, id } = req.params;

      if (!workspaceId || !workspaceConnectionId || !id) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const reqBody = req.body as TWorkspaceEntityConnection;

      const payload = {
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        workspace_slug: reqBody.workspace_slug,
        project_id: reqBody.project_id,
        entity_id: reqBody.entity_id,
        entity_slug: reqBody.entity_slug,
        entity_data: reqBody.entity_data,
        config: reqBody.config,
      };

      const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        workspace_id: workspaceId,
        id: id,
      });

      if (!entityConnection) {
        return responseHandler(res, 400, new Error("Entity connection not found"));
      }

      const entityConnections = await apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(
        entityConnection.id,
        payload
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:id")
  @useValidateUserAuthentication()
  async getEntityConnectionByConnectionId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({
          message: "Bad Request, expected id to be present.",
        });
      }

      const entityConnections = await apiClient.workspaceEntityConnection.getWorkspaceEntityConnection(id);

      return res.status(200).send(entityConnections);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Put("/:id")
  @useValidateUserAuthentication()
  async updateEntityConnectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({
          message: "Bad Request, expected id to be present.",
        });
      }

      const payload = {
        workspace_slug: req.body.workspaceSlug,
        project_id: req.body.projectId,
        entity_id: req.body.entityId,
        entity_slug: req.body.entitySlug,
        entity_data: req.body.entityData,
        config: req.body.config,
      };

      const entityConnections = await apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(id, payload);

      return res.status(200).send(entityConnections);
    } catch (error) {
      logger.error("Failed to update entity connection:", error);
      return responseHandler(res, 500, error);
    }
  }

  @Delete("/:id")
  @useValidateUserAuthentication()
  async deleteEntityConnectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({
          message: "Bad Request, expected id to be present.",
        });
      }

      const entityConnections = await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(id);

      return res.status(200).send(entityConnections);
    } catch (error) {
      logger.error("Failed to delete entity connection:", error);
      return responseHandler(res, 500, error);
    }
  }

  @Delete("/:workspaceId/:workspaceConnectionId/:id")
  @useValidateUserAuthentication()
  async deleteEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, id: id } = req.params;

      if (!workspaceId || !workspaceConnectionId || !id) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        workspace_id: workspaceId,
        id: id,
      });

      if (!entityConnection) {
        return responseHandler(res, 400, new Error("Entity connection not found"));
      }

      const entityConnections = await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(
        entityConnection.id
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      logger.error("Failed to delete entity connection:", error);
      return responseHandler(res, 500, error);
    }
  }
}
