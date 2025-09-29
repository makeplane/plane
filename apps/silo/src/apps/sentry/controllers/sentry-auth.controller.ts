import { Request, Response } from "express";
import { Controller, Post } from "@plane/decorators";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";
import { EnsureEnabled, useValidateUserAuthentication } from "@/lib/decorators";
import { getAPIClient } from "@/services/client";

const apiClient = getAPIClient();

@Controller("/api/sentry")
@EnsureEnabled(E_INTEGRATION_KEYS.SENTRY)
export class SentryAuthController {
  /*
   * The SentryAuthController handles the authentication flow between Sentry and Plane,
   * allowing users to connect their Sentry accounts to their Plane workspaces.
   */

  @Post("/app/disconnect")
  async disconnectSentry(req: Request, res: Response) {
    try {
      const { connectionId, workspaceId } = req.body;

      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SENTRY,
        connection_id: connectionId,
        workspace_id: workspaceId,
      });

      if (connections.length === 0) {
        return res.sendStatus(200);
      }

      const connection = connections[0];
      const integrationUrl = `https://${connection.connection_slug}.sentry.io/settings/sentry-apps/${env.SENTRY_INTEGRATION_SLUG}/`;
      /*
       * There is no way we can delete a sentry integration from the Sentry API.
       * The sentry documentation mentions about the installation delete event
       * but we don't have a way to delete when the app is disconnected from plane
       * end.
       * https://docs.sentry.io/organization/integrations/integration-platform/public-integration/#uninstallation
       */
      return res.send(integrationUrl);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/app/update")
  @useValidateUserAuthentication()
  async updateAppConnection(req: Request, res: Response) {
    try {
      const { workspaceId, connectionId, connection } = req.body;
      if (!workspaceId || !connectionId || !connection) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, connectionId and connection to be present.",
        });
      }

      const existingConnections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SENTRY,
        connection_id: connectionId,
        workspace_id: workspaceId,
      });

      if (existingConnections.length === 0 || existingConnections.length > 1) {
        return res.status(400).send({
          message: "Bad Request, expected only one connection to be present.",
        });
      }

      const existingConnection = existingConnections[0];
      if (existingConnection.connection_slug !== connection.connection_slug) {
        return res.status(400).send({
          message: "Bad Request, expected connection slug to be present.",
        });
      }

      const updatedConnection = await apiClient.workspaceConnection.updateWorkspaceConnection(
        existingConnection.id,
        connection
      );
      return res.json(updatedConnection);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}
