import crypto from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { createGithubService, GithubInstallation, GithubRepository, GithubWebhookPayload } from "@plane/etl/github";
import { ExIssue, ExIssueComment, ExIssueLabel, PlaneWebhookPayloadBase } from "@plane/sdk";
import { TGithubAppConfig, TGithubWorkspaceConnection } from "@plane/types";
import { env } from "@/env";
import { GITHUB_LABEL, PLANE_LABEL } from "@/helpers/constants";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, EnsureEnabled, Get, Middleware, Post, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { integrationTaskManager } from "@/worker";

@EnsureEnabled(E_INTEGRATION_KEYS.GITHUB_ENTERPRISE)
@Controller("/api/github-enterprise")
export default class GithubEnterpriseController {
  private readonly integrationKey = E_INTEGRATION_KEYS.GITHUB_ENTERPRISE;

  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send({ message: "pong" });
  }

  /*------------------ Data Endpoints -------------------- */
  @Get("/:workspaceId/installations")
  @useValidateUserAuthentication()
  async getInstallations(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      // get the connection for the workspace id, where the source is integrationKey
      const wsConnection = (await integrationConnectionHelper.getWorkspaceConnection({
        connection_type: this.integrationKey,
        workspace_id: workspaceId,
      })) as TGithubWorkspaceConnection;

      if (!wsConnection) {
        return res.status(400).send({
          message: "No connections found for the workspace",
        });
      }

      const appConfig = wsConnection.connection_data.appConfig as TGithubAppConfig;

      if (!appConfig?.appId) {
        return res.status(400).send({
          message: "No app config found for the workspace",
        });
      }

      // Get the credentials for the workspace id, where the source is integrationKey
      const credential = await integrationConnectionHelper.getWorkspaceCredential({
        credential_id: wsConnection.credential_id,
      });

      // If there are no credentials, this simply means that there is nothing
      // installed for the workspace, so we return an empty array
      if (!credential?.source_access_token) {
        return res.status(401).json({
          message: "No installations found for the workspace",
        });
      }

      const service = createGithubService(appConfig.appId, appConfig.privateKey, credential.source_access_token);

      const installations: GithubInstallation[] = [];

      // Get each installation for the workspace

      const installationId = Number(credential.source_access_token);

      const installation = await service.getInstallation(installationId);
      if (installation && installation.data && installation.status === 200) {
        installations.push(installation.data);
      }

      // Return the response of the installation
      res.status(200).json(installations);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:workspaceId/repos")
  @useValidateUserAuthentication()
  async getWorkspaceAccessibleRepositories(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      // get the connection for the workspace id, where the source is integrationKey
      const wsConnection = (await integrationConnectionHelper.getWorkspaceConnection({
        connection_type: this.integrationKey,
        workspace_id: workspaceId,
      })) as TGithubWorkspaceConnection;

      if (!wsConnection) {
        return res.status(400).send({
          message: "No connections found for the workspace",
        });
      }

      // Get the credentials for the workspace id, where the source is integrationKey
      const credential = await integrationConnectionHelper.getWorkspaceCredential({
        credential_id: wsConnection.credential_id,
      });

      if (!credential?.source_access_token) {
        return res.status(400).send({
          message: "No credentials found for the workspace",
        });
      }

      const appConfig = wsConnection.connection_data.appConfig as TGithubAppConfig;

      if (!appConfig?.appId) {
        return res.status(400).send({
          message: "No app config found for the workspace",
        });
      }

      const service = createGithubService(
        appConfig.appId,
        appConfig.privateKey,
        credential.source_access_token,
        appConfig.baseUrl
      );

      const repositories: GithubRepository[] = [];

      const repos = await service.getReposForInstallation(Number(credential.source_access_token));
      if (repos) {
        repositories.push(...repos.map((repo: any) => ({ id: repo.id, name: repo.name, full_name: repo.full_name })));
      }

      res.status(200).json(repositories);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
  /* -------------------- Data Endpoints -------------------- */

  /* ------------------- Webhook Endpoints ------------------- */
  @Post("/github-webhook")
  @Middleware(verifyGithubWebhook as RequestHandler)
  async githubWebhook(req: Request, res: Response) {
    try {
      // Get the event types and the delivery id
      const eventType = req.headers["x-github-event"];
      const deliveryId = req.headers["x-github-delivery"];

      const payload = req.body as GithubWebhookPayload;
      logGithubWebhookPayload(payload, eventType, deliveryId);

      if (!payload?.installation?.id) {
        return res.status(400).send({
          message: "Installation ID is required to process the webhook",
        });
      }

      if (eventType === "issues") {
        const issuePayload = req.body as GithubWebhookPayload["webhook-issues-opened"];

        // Discard the issue, if the labels doens't include github label
        if (!issuePayload.issue?.labels?.find((label) => label.name.toLowerCase() === PLANE_LABEL)) {
          return res.status(202).send({
            message: "Webhook received",
          });
        }
        await integrationTaskManager.registerStoreTask(
          {
            route: "github-webhook",
            jobId: eventType as string,
            type: eventType as string,
          },
          {
            installationId: issuePayload.installation?.id,
            owner: issuePayload.repository.owner.login,
            accountId: issuePayload.organization ? issuePayload.organization.id : issuePayload.repository.owner.id,
            repositoryId: issuePayload.repository.id,
            repositoryName: issuePayload.repository.name,
            issueNumber: issuePayload.issue.number,
            isEnterprise: true,
            eventActorId: issuePayload?.sender?.id,
          },
          Number(env.DEDUP_INTERVAL)
        );
        // Forward the event to the task manager to process
      } else if (eventType === "pull_request") {
        const pullRequestPayload = req.body as GithubWebhookPayload["webhook-pull-request-opened"];
        await integrationTaskManager.registerStoreTask(
          {
            route: "github-webhook",
            jobId: eventType as string,
            type: eventType as string,
          },
          {
            installationId: pullRequestPayload.installation?.id,
            owner: pullRequestPayload.repository.owner.login,
            accountId: pullRequestPayload.organization
              ? pullRequestPayload.organization.id
              : pullRequestPayload.repository.owner.id,
            repositoryId: pullRequestPayload.repository.id,
            repositoryName: pullRequestPayload.repository.name,
            pullRequestNumber: pullRequestPayload.pull_request.number,
            isEnterprise: true,
            eventActorId: pullRequestPayload?.sender?.id,
          },
          Number(env.DEDUP_INTERVAL)
        );
      } else {
        await integrationTaskManager.registerTask(
          {
            route: "github-webhook",
            jobId: deliveryId as string,
            type: eventType as string,
          },
          {
            ...req.body,
            isEnterprise: true,
          }
        );
      }

      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      logger.error("Failed to process GitHub webhook:", error);
      responseHandler(res, 500, error);
    }
  }

  @Post("/plane-webhook")
  async planeWebhook(req: Request, res: Response) {
    try {
      // Get the event types and delivery id
      const eventType = req.headers["x-plane-event"];
      const event = req.body.event;

      if (event == "issue" || event == "issue_comment") {
        const payload = req.body as PlaneWebhookPayloadBase<ExIssue | ExIssueComment>;

        const id = payload.data.id;
        const workspace = payload.data.workspace;
        const project = payload.data.project;
        const issue = payload.data.issue;

        const log = {
          eventType,
          event,
          id,
          workspace,
          project,
        };

        logger.info("Plane webhook received", log);

        if (event == "issue") {
          const labels = req.body.data.labels as ExIssueLabel[] | undefined;
          // If labels doesn't include github label, then we don't need to process this event
          if (!labels || !labels.find((label) => label.name.toLowerCase() === GITHUB_LABEL)) {
            return res.status(202).send({
              message: "Webhook received",
            });
          }

          // Reject the activity, that is not useful
          const skipFields = ["priority", "state", "start_date", "target_date", "cycles", "parent", "modules", "link"];
          if (payload.activity.field && skipFields.includes(payload.activity.field)) {
            return res.status(202).send({
              message: "Webhook received",
            });
          }
        }

        // Forward the event to the task manager to process
        await integrationTaskManager.registerStoreTask(
          {
            route: "plane-github-webhook",
            jobId: eventType as string,
            type: eventType as string,
          },
          {
            id,
            event,
            workspace,
            project,
            issue,
            isEnterprise: true,
          },
          Number(env.DEDUP_INTERVAL)
        );
      }
      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  /* ------------------- Webhook Endpoints ------------------- */
}

const logGithubWebhookPayload = (
  payload: any,
  eventType: string | string[] | undefined,
  deliveryId: string | string[] | undefined
): void => {
  const log = {
    eventType,
    deliveryId,
    installationId: payload?.installation?.id,
    owner: payload?.repository?.owner?.login,
    repositoryId: payload?.repository?.id,
    repositoryName: payload?.repository?.name,
  };

  logger.info(`Github Enterprise Webhook Payload`, {
    log,
  });
};

async function verifyGithubWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const issuePayload = req.body;
    const installationId = issuePayload.installation?.id;

    if (!installationId) {
      logger.info("No installation id found in the webhook payload", {
        payload: req.body,
      });
      return res.status(401).json({
        error: "No installation id found in the webhook payload",
      });
    }

    const connectionId = issuePayload?.organization?.id || issuePayload.repository?.owner?.id;

    if (!connectionId) {
      logger.info("No connection id found in the webhook payload");
      return res.status(401).json({
        error: "No connection id found in the webhook payload",
      });
    }

    // fetching appConfig from the workspace connection
    const wsConnection = (await integrationConnectionHelper.getWorkspaceConnection({
      connection_id: connectionId.toString(),
      connection_type: E_INTEGRATION_KEYS.GITHUB_ENTERPRISE,
    })) as TGithubWorkspaceConnection;

    if (!wsConnection) {
      logger.info("No workspace connection found for the installation", {
        installationId,
      });
      return res.status(401).json({
        error: "No workspace connection found for the installation",
      });
    }

    const appConfig = wsConnection?.connection_data?.appConfig as TGithubAppConfig;

    // If the webhook secret is not set, we don't need to verify the signature
    if (!appConfig?.webhookSecret) {
      logger.info("No webhook secret found for the workspace", {
        installationId,
      });
      return next();
    }

    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const id = req.headers["x-github-delivery"];

    const payload = JSON.stringify(req.body);

    // Make sure all required headers are present
    if (!signature || !event || !id) {
      logGithubWebhookPayload(req.body, event, id);
      return res.status(401).json({
        error: "Missing required headers",
      });
    }

    // Get the raw body of the request
    if (!payload) {
      logGithubWebhookPayload(req.body, event, id);
      return res.status(400).json({
        error: "Request body empty",
      });
    }

    // Calculate expected signature
    const hmac = crypto.createHmac("sha256", appConfig.webhookSecret);
    const calculatedSignature = "sha256=" + hmac.update(payload).digest("hex");

    // Constant time comparison to prevent timing attacks
    const verified = crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature as string));

    if (!verified) {
      logGithubWebhookPayload(req.body, event, id);
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    // Signature is valid, proceed
    next();
  } catch (error) {
    logger.error("Error validating GitHub webhook:", error);
    return res.status(500).json({
      error: "Error validating webhook signature",
    });
  }
}
