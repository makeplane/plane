import { Request, Response } from "express";
import { Controller, Get } from "@plane/decorators";
import { E_IMPORTER_KEYS, E_SILO_ERROR_CODES, TAppKeys } from "@plane/etl/core";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { getSupportedIntegrations } from "@/helpers/app";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { responseHandler } from "@/helpers/response-handler";
import { useValidateUserAuthentication } from "@/lib";
import { planeOAuthService } from "@/services/oauth";
import { EOAuthGrantType } from "@/types/oauth";
import { getAppOAuthCallbackUrl, getCallbackSuccessUrl } from "../helpers/urls";

@Controller("/api")
export class AppController {
  @Get("/supported-integrations")
  async GetSupportedIntegrations(req: Request, res: Response) {
    try {
      const supportedIntegrations: E_INTEGRATION_KEYS[] = getSupportedIntegrations();
      res.status(200).json(supportedIntegrations);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/plane-app-details/:provider")
  async getPlaneAppDetails(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      if (
        !Object.values([E_IMPORTER_KEYS.IMPORTER, ...Object.values(E_INTEGRATION_KEYS)].flat()).includes(
          provider as E_INTEGRATION_KEYS | E_IMPORTER_KEYS
        )
      ) {
        throw new Error("Invalid provider");
      }

      const { planeAppId, planeAppClientId } = await getPlaneAppDetails(provider as TAppKeys);
      res.status(200).json({
        appId: planeAppId,
        clientId: planeAppClientId,
      });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * Get OAuth app installation status for workspace
   */
  @Get("/apps/:workspaceId/enabled-integrations")
  @useValidateUserAuthentication()
  async getEnabledIntegrationsForWorkspace(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params;
    try {
      const allConnections = await integrationConnectionHelper.getWorkspaceConnections({
        workspace_id: workspaceId as string,
      });

      // Extract unique connection types
      const seenTypes = new Set<string>();
      const connectionTypes: {
        id: string;
        connection_provider: string;
        connection_slug: string | null | undefined;
        connection_id: string;
      }[] = allConnections
        .filter((connection) => {
          if (seenTypes.has(connection.connection_type)) {
            return false;
          }
          seenTypes.add(connection.connection_type);
          return true;
        })
        .map((connection) => ({
          id: connection.connection_type,
          connection_provider: connection.connection_type,
          connection_slug: connection.connection_slug,
          connection_id: connection.connection_id,
        }));
      res.status(200).json(connectionTypes);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * Generate consent URL for OAuth app installation
   */
  @Get("/apps/:provider/auth/consent-url")
  @useValidateUserAuthentication()
  async createConsentUrl(req: Request, res: Response): Promise<void> {
    const { provider } = req.params;

    if (!provider) {
      res.status(400).json({
        error: "Missing required fields",
        message: "provider is required",
      });
      return;
    }

    try {
      const { planeAppClientId } = await getPlaneAppDetails(provider as TAppKeys);
      if (!planeAppClientId) {
        res.status(500).json({ error: E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS });
        return;
      }

      const redirectUri = getAppOAuthCallbackUrl(provider);
      const consentUrl = planeOAuthService.getPlaneOAuthRedirectUrl(planeAppClientId, redirectUri, "");
      return res.status(302).redirect(consentUrl);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * Handle OAuth app callback and create workspace credentials/connections
   */
  @Get("/apps/:provider/auth/callback")
  async handleCallback(req: Request, res: Response): Promise<void> {
    const { provider } = req.params;
    const { code, app_installation_id } = req.query;

    if (!provider || !code || !app_installation_id) {
      res.status(400).json({
        error: "Missing required parameters",
        message: "provider, code, and app_installation_id are required",
      });
      return;
    }

    try {
      // Get Plane app details and generate token
      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(provider as TAppKeys);
      if (!planeAppClientId || !planeAppClientSecret) {
        const redirectBase = `${env.APP_BASE_URL}/error?error=${E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS}`;
        res.redirect(redirectBase);
        return;
      }

      const tokenResponse = await planeOAuthService.generateToken({
        client_id: planeAppClientId,
        client_secret: planeAppClientSecret,
        grant_type: EOAuthGrantType.CLIENT_CREDENTIALS,
        app_installation_id: app_installation_id as string,
      });

      // Get app installation details
      const appInstallation = await planeOAuthService.getAppInstallation(
        tokenResponse.access_token,
        app_installation_id as string
      );

      // Create workspace credential
      const credential = await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
        workspace_id: appInstallation.workspace_detail.id,
        user_id: appInstallation.installed_by,
        source: provider as E_INTEGRATION_KEYS,
        source_access_token: "", // OAuth apps don't typically have source tokens
        source_refresh_token: "",
        target_access_token: tokenResponse.access_token,
        target_refresh_token: tokenResponse.refresh_token || "",
        target_authorization_type: EOAuthGrantType.CLIENT_CREDENTIALS,
        target_identifier: app_installation_id as string,
        source_hostname: "",
        source_identifier: appInstallation.id,
        source_authorization_type: EOAuthGrantType.CLIENT_CREDENTIALS,
      });

      // Create workspace connection
      await integrationConnectionHelper.createOrUpdateWorkspaceConnection({
        workspace_id: appInstallation.workspace_detail.id,
        connection_type: provider as E_INTEGRATION_KEYS,
        target_hostname: env.API_BASE_URL,
        connection_id: appInstallation.id,
        connection_data: {
          app_installation: appInstallation,
        },
        credential_id: credential.id,
        connection_slug: `${provider}-${appInstallation.id}`,
        config: {},
      });

      // Redirect to success page
      const redirectUri = getCallbackSuccessUrl(provider, appInstallation.workspace_detail.slug);
      res.redirect(redirectUri);
    } catch (error: any) {
      logger.error("OAuth app callback error:", error);
      res.redirect(`${env.APP_BASE_URL}/error?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }
}
