import { Request, Response } from "express";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, EnsureEnabled, Get, Post } from "@/lib";
import { SentryAssetsController } from "./sentry-assets.controller";
import { SentryAuthController } from "./sentry-auth.controller";
import { SentryWebhookController } from "./sentry-webhook.controller";

@Controller("/api/sentry")
@EnsureEnabled(E_INTEGRATION_KEYS.SENTRY)
class SentryController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/alert-rule")
  async createAlertRule(req: Request, res: Response) {
    try {
      res.send(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}

export default [SentryController, SentryAuthController, SentryWebhookController, SentryAssetsController];
