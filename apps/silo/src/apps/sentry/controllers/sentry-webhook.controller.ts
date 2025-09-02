import { Request, Response } from "express";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { SentryWebhookHeaders, SentryWebhookPayload } from "@plane/etl/sentry";
import { ExIssue, PlaneWebhookPayloadBase } from "@plane/sdk";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, EnsureEnabled, Post } from "@/lib";
import { integrationTaskManager } from "@/worker";

@Controller("/api/sentry")
@EnsureEnabled(E_INTEGRATION_KEYS.SENTRY)
export class SentryWebhookController {
  /*
   * The SentryWebhookController handles the webhooks from Sentry, allowing
   * Plane to receive notifications about new issues, comments, and more.
   */

  @Post("/sentry-webhook")
  async sentryWebhook(req: Request, res: Response) {
    try {
      const headers = req.headers as unknown as SentryWebhookHeaders;
      const resource = headers["sentry-hook-resource"];
      const requestId = headers["request-id"];
      const webhook = req.body as SentryWebhookPayload;

      if (!webhook) {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const acceptedResources = ["issue", "event_alert", "installation"];

      if (!acceptedResources.includes(resource)) {
        return res.status(400).json({ error: "Resource not accepted" });
      }

      await integrationTaskManager.registerTask(
        {
          route: "sentry-webhook",
          jobId: requestId,
          type: resource,
        },
        webhook
      );

      res.status(200).json({ status: "success" });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/plane/events")
  async planeEvents(req: Request, res: Response) {
    try {
      res.status(202).send({
        message: "Webhook received",
      });
      // Get the event types and delivery id
      const eventType = req.headers["x-plane-event"];
      const event = req.body.event;
      if (event == "issue") {
        const payload = req.body as PlaneWebhookPayloadBase<ExIssue>;

        const id = payload.data.id;
        const workspace = payload.data.workspace;
        const project = payload.data.project;
        const issue = payload.data.issue;

        // Only accept  the state activity
        const acceptedFields = ["state", "state_id"];
        if (payload.activity.field && acceptedFields.includes(payload.activity.field)) {
          // Forward the event to the task manager to process
          await integrationTaskManager.registerStoreTask(
            {
              route: "plane-sentry-webhook",
              jobId: eventType as string,
              type: eventType as string,
            },
            {
              id,
              event,
              workspace,
              project,
              issue,
            },
            Number(env.DEDUP_INTERVAL)
          );
        }

      }
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }
}
