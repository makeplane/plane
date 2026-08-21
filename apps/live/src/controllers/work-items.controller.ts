/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Request } from "express";
import type { WebSocket } from "ws";
import { Controller, WebSocket as WSDecorator } from "@plane/decorators";
import { logger } from "@plane/logger";
import { handleAuthentication } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { APIService } from "@/services/api.service";
import { workItemRealtimeHub } from "@/services/work-item-realtime.service";

class ProjectAccessService extends APIService {
  async getProject(workspaceSlug: string, projectId: string, cookie: string) {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/`, {
      headers: { Cookie: cookie },
    }).then((response) => response?.data);
  }

  async getProjectMembership(workspaceSlug: string, projectId: string, cookie: string) {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/project-members/me/`, {
      headers: { Cookie: cookie },
    }).then((response) => response?.data);
  }
}

@Controller("/work-items")
export class WorkItemsController {
  [key: string]: unknown;

  @WSDecorator("/")
  handleConnection(ws: WebSocket, req: Request) {
    void this.bindConnection(ws, req);
  }

  private async bindConnection(ws: WebSocket, req: Request) {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const projectId = url.searchParams.get("projectId") || "";
      const workspaceSlug = url.searchParams.get("workspaceSlug") || "";
      const userId = url.searchParams.get("userId") || "";
      const cookie = req.headers.cookie?.toString();

      if (!projectId || !workspaceSlug || !userId || !cookie) {
        ws.close(4401, "Missing realtime credentials");
        return;
      }

      await handleAuthentication({ cookie, userId });

      const projectService = new ProjectAccessService();
      let project: { guest_view_all_features?: boolean } = {};
      let role = 15;
      try {
        const [projectData, membership] = await Promise.all([
          projectService.getProject(workspaceSlug, projectId, cookie),
          projectService.getProjectMembership(workspaceSlug, projectId, cookie),
        ]);
        project = projectData;
        role = Number(membership?.role ?? 15);
      } catch (error) {
        const appError = new AppError(error);
        logger.error("WORK_ITEMS_CONTROLLER: Project access check failed", appError);
        ws.close(4403, "You are not a member of this project");
        return;
      }

      await workItemRealtimeHub.addClient(ws, {
        projectId,
        userId,
        isGuest: Number(role) === 5,
        guestCanViewAllWorkItems: Boolean(project?.guest_view_all_features),
      });
    } catch (error) {
      logger.error("WORK_ITEMS_CONTROLLER: Failed to bind work item socket", error);
      ws.close(1011, "Internal server error");
    }
  }
}
