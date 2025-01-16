import { NextFunction, Request, Response } from "express";
import { Controller, Get, Post, Put, Delete } from "@/lib";
import {
  createEntityConnectionByWorkspaceConnectionId,
  deleteEntityConnection,
  deleteEntityConnectionByWorkspaceConnectionIdAndEntityId,
  getEntityConnection,
  getEntityConnectionByWorkspaceIdAndConnectionId,
  getEntityConnectionByWorkspaceIdAndConnectionIdAndEntityId,
  updateEntityConnection,
  updateEntityConnectionByWorkspaceConnectionIdAndEntityId,
} from "@/db/query/connection";
import { responseHandler } from "@/helpers/response-handler";

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
      responseHandler(res, 500, error)
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
      responseHandler(res, 500, error)
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
      responseHandler(res, 500, error)
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
      responseHandler(res, 500, error)
    }
  }


  @Get("/:id")
  async getEntityConnectionByConnectionId(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({
          message: "Bad Request, expected id to be present.",
        });
      }

      const entityConnections = await getEntityConnection(id);

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      responseHandler(res, 500, error)
    }
  }

  @Put("/:id")
  async updateEntityConnectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({
          message: "Bad Request, expected id to be present.",
        });
      }

      const payload = {
        workspaceSlug: req.body.workspaceSlug,
        projectId: req.body.projectId,
        entityId: req.body.entityId,
        entitySlug: req.body.entitySlug,
        entityData: req.body.entityData,
        config: req.body.config,
      };

      const entityConnections = await updateEntityConnection(
        id,
        payload
      );

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      responseHandler(res, 500, error)
    }
  }


  @Delete("/:id")
  async deleteEntityConnectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({
          message: "Bad Request, expected id to be present.",
        });
      }

      const entityConnections = await deleteEntityConnection(id);

      return res.status(200).send(entityConnections);
    } catch (error) {
      console.error(error);
      responseHandler(res, 500, error)
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
      responseHandler(res, 500, error)
    }
  }
}
