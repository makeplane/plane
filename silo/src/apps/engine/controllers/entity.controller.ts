import { Request, Response } from "express";
import { Controller, Get, Post, Put, Delete } from "@/lib";
import {
  createEntityConnectionByWorkspaceConnectionId,
  deleteEntityConnectionByWorkspaceConnectionIdAndEntityId,
  getEntityConnectionByWorkspaceIdAndConnectionId,
  getEntityConnectionByWorkspaceIdAndConnectionIdAndEntityId,
  updateEntityConnectionByWorkspaceConnectionIdAndEntityId,
} from "@/db/query/connection";

@Controller("/api/entity-connections")
export class EntityConnectionController {
  @Get("/:workspaceId/:workspaceConnectionId")
  async getEntityConnections(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;

      if (!workspaceId || !workspaceConnectionId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, and workspaceConnectionId to be present.",
        });
      }

      const entityConnections = await getEntityConnectionByWorkspaceIdAndConnectionId(
        workspaceId,
        workspaceConnectionId
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  @Get("/:workspaceId/:workspaceConnectionId/:entityId")
  async getEntityConnectionById(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, entityId } = req.params;

      if (!workspaceId || !workspaceConnectionId || !entityId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const entityConnections = await getEntityConnectionByWorkspaceIdAndConnectionIdAndEntityId(
        workspaceId,
        workspaceConnectionId,
        entityId
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  @Post("/:workspaceId/:workspaceConnectionId")
  async createEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;

      if (!workspaceId || !workspaceConnectionId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const payload = {
        workspaceId,
        workspaceConnectionId,
        workspaceSlug: req.body.workspaceSlug,
        projectId: req.body.projectId,
        entityId: req.body.entityId,
        entitySlug: req.body.entitySlug,
        entityData: req.body.entityData,
        config: req.body.config,
      };

      const entityConnections = await createEntityConnectionByWorkspaceConnectionId(
        workspaceId,
        workspaceConnectionId,
        payload
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  @Put("/:workspaceId/:workspaceConnectionId/:entityId")
  async updateEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, entityId } = req.params;

      if (!workspaceId || !workspaceConnectionId || !entityId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const payload = {
        workspaceId,
        workspaceConnectionId,
        workspaceSlug: req.body.workspaceSlug,
        projectId: req.body.projectId,
        entityId: req.body.entityId,
        entitySlug: req.body.entitySlug,
        entityData: req.body.entityData,
        config: req.body.config,
      };

      const entityConnections = await updateEntityConnectionByWorkspaceConnectionIdAndEntityId(
        workspaceId,
        workspaceConnectionId,
        entityId,
        payload
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  @Delete("/:workspaceId/:workspaceConnectionId/:entityId")
  async deleteEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, entityId } = req.params;

      if (!workspaceId || !workspaceConnectionId || !entityId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const entityConnections = await deleteEntityConnectionByWorkspaceConnectionIdAndEntityId(
        workspaceId,
        workspaceConnectionId,
        entityId
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }
}
