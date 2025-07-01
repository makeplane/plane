import { Request, Response } from "express";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Get, Post, useValidateUserAuthentication } from "@/lib";
import { OAuthController } from "./controller";

@Controller("/api/oauth")
export class OAuthRoutes {
  private controller: OAuthController;

  constructor() {
    this.controller = new OAuthController();
  }

  @Get("/:provider/auth/organization-status/:workspaceId")
  @useValidateUserAuthentication()
  @enrichIntegrationKey()
  async getOrganizationConnectionStatus(req: Request, res: Response) {
    try {
      const { integrationKey, workspaceId } = req.params;
      const status = await this.controller.getConnectionStatus(integrationKey as E_INTEGRATION_KEYS, workspaceId);
      return res.json(status);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:provider/auth/organization-disconnect/:workspaceId/:connectionId/:userId")
  @useValidateUserAuthentication()
  @enrichIntegrationKey()
  async disconnectOrganization(req: Request, res: Response) {
    try {
      const { integrationKey, workspaceId, connectionId } = req.params;
      await this.controller.disconnectOrganization(integrationKey as E_INTEGRATION_KEYS, workspaceId, connectionId);
      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:provider/auth/url")
  @useValidateUserAuthentication()
  @enrichIntegrationKey()
  async getAuthURL(req: Request, res: Response) {
    try {
      const { integrationKey } = req.params;
      const { workspace_id, workspace_slug, plane_api_token, target_host, user_id } = req.body;

      if (!workspace_id || !workspace_slug || !plane_api_token || !target_host || !user_id) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const authUrl = await this.controller.getAuthUrl(integrationKey as E_INTEGRATION_KEYS, {
        workspace_id,
        workspace_slug,
        plane_api_token,
        target_host,
        user_id,
      });

      res.json({ url: authUrl });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:provider/auth/callback")
  @enrichIntegrationKey()
  async authCallback(req: Request, res: Response) {
    try {
      const { integrationKey } = req.params;
      const { code, state: stateQuery, app_installation_id: plane_app_installation_id } = req.query;
      let state = stateQuery as string;

      // If the state is not provided, use the plane_app_installation_id
      // this is used for plane's internal app installation flow
      if (!state && plane_app_installation_id) {
        state = plane_app_installation_id as string;
      }

      if (!code || !state) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      return this.controller.handleCallback(integrationKey as E_INTEGRATION_KEYS, code as string, state as string, res);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:provider/auth/user-callback")
  @enrichIntegrationKey()
  async userAuthCallback(req: Request, res: Response) {
    try {
      const { integrationKey } = req.params;
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      await this.controller.handleUserAuthCallback(
        integrationKey as E_INTEGRATION_KEYS,
        code as string,
        state as string,
        res
      );
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:provider/auth/user-status/:workspaceId/:userId")
  @useValidateUserAuthentication()
  @enrichIntegrationKey()
  async getUserConnectionStatus(req: Request, res: Response) {
    try {
      const { integrationKey, workspaceId, userId } = req.params;
      const status = await this.controller.getUserConnectionStatus(
        integrationKey as E_INTEGRATION_KEYS,
        workspaceId,
        userId
      );
      return res.json(status);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/:provider/auth/user-disconnect/:workspaceId/:userId")
  @useValidateUserAuthentication()
  @enrichIntegrationKey()
  async disconnectUser(req: Request, res: Response) {
    try {
      const { integrationKey, workspaceId, userId } = req.params;
      await this.controller.disconnectUser(integrationKey as E_INTEGRATION_KEYS, workspaceId, userId);
      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}

// Utility function to convert provider string to E_INTEGRATION_KEYS
const convertProviderToIntegrationKey = (provider: string): E_INTEGRATION_KEYS => {
  // Convert "github" to "GITHUB"
  // Convert "prd-agent" to "PRD_AGENT"
  const normalizedProvider = provider.toUpperCase().replace(/-/g, "_");

  // Validate if the converted value is a valid E_INTEGRATION_KEYS
  if (Object.values(E_INTEGRATION_KEYS).includes(normalizedProvider as E_INTEGRATION_KEYS)) {
    return normalizedProvider as E_INTEGRATION_KEYS;
  }

  throw new Error(`Invalid provider: ${provider}`);
};

// Decorator to enrich request with integration key
function enrichIntegrationKey() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response) {
      try {
        const { provider } = req.params;
        req.params.integrationKey = convertProviderToIntegrationKey(provider);
        return await originalMethod.call(this, req, res);
      } catch (error) {
        return responseHandler(res, 500, error);
      }
    };

    return descriptor;
  };
}
