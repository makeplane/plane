import { logger } from "@sentry/utils";
import { DatabaseSingleton } from "../db/singleton";
import {
  integrations,
  workspaceIntegrations,
} from "../db/schema/integrations.schema";
import { gte, sql } from "drizzle-orm";

export type TSlackConfig = {
  team_id: string;
  access_token: string;
};

export type TSlackMetadata = {
  ok: boolean;
  team: {
    id: string;
    name: string;
  };
  scope: string;
  app_id: string;
  enterprise?: any;
  token_type: string;
  authed_user: {
    id: string;
  };
  bot_user_id: string;
  access_token: string;
  incoming_webhook: Incomingwebhook;
  is_enterprise_install: boolean;
};
export type Incomingwebhook = {
  url: string;
  channel: string;
  channel_id: string;
  configuration_url: string;
};

export class SlackService {
  async getWorkspaceId(teamId: string): Promise<string | undefined> {
    const db = DatabaseSingleton.getInstance().db;
    if (!db) {
      console.log("no db");
      return;
    }
    const workspace = await db.query.workspaceIntegrations.findFirst({
      where: gte(workspaceIntegrations.metadata, { team: { id: teamId } }),
    });
    if (workspace && workspace.workspaceId) {
      return workspace.workspaceId;
    }
  }

  async getIntegration(): Promise<{ integrationId: string } | void> {
    const db = DatabaseSingleton.getInstance().db;
    if (db) {
      const slackIntegration = await db
        .select({
          integrationId: integrations.id,
        })
        .from(integrations)
        .where(sql`${integrations.provider} = 'slack'`);

      if (slackIntegration.length > 0) {
        return slackIntegration[0];
      }
    }
  }

  async getConfig(): Promise<{ slackConfig: TSlackConfig } | void> {
    const db = DatabaseSingleton.getInstance().db;
    const integration = await this.getIntegration();

    if (db && integration) {
      const slackConfig = await db
        .select({
          slackConfig: workspaceIntegrations.config,
        })
        .from(workspaceIntegrations)
        .where(
          sql`${workspaceIntegrations.integrationId} = ${integration.integrationId}`,
        );

      if (slackConfig.length > 0) {
        return slackConfig[0] as { slackConfig: TSlackConfig };
      }
    }
  }

  async getMetadata(): Promise<{ slackMetadata: TSlackMetadata } | void> {
    const db = DatabaseSingleton.getInstance().db;
    const integration = await this.getIntegration();
    if (db && integration) {
      const slackMetadata = await db
        .select({
          slackMetadata: workspaceIntegrations.metadata,
        })
        .from(workspaceIntegrations)
        .where(
          sql`${workspaceIntegrations.integrationId} = ${integration.integrationId}`,
        );

      if (slackMetadata.length > 0) {
        return slackMetadata[0] as { slackMetadata: TSlackMetadata };
      }
    }
  }

  async sendMessage(template: { text: string; blocks: any[] }) {
    const slackMetadata = await this.getMetadata();
    if (!slackMetadata) {
      return;
    }
    const slackWebhookUrl = slackMetadata?.slackMetadata.incoming_webhook.url;
    try {
      await fetch(slackWebhookUrl, {
        method: "POST",
        body: JSON.stringify(template),
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      logger.error(error);
    }
  }

  async openModal(triggerId: string, modal: any) {
    const slackConfig = await this.getConfig();
    if (!slackConfig) {
      return;
    }
    const slackAccessToken = slackConfig.slackConfig.access_token;

    try {
      await fetch("https://slack.com/api/views.open", {
        method: "POST",
        body: JSON.stringify({
          trigger_id: triggerId,
          view: modal,
        }),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${slackAccessToken}`,
        },
      });
    } catch (error) {
      logger.error(error);
    }
  }

  async updateModal(viewId: string, updatedModal: any) {
    const slackConfig = await this.getConfig();
    if (!slackConfig) {
      return;
    }
    const slackAccessToken = slackConfig.slackConfig.access_token;
    try {
      await fetch("https://slack.com/api/views.update", {
        method: "POST",
        body: JSON.stringify({
          view_id: viewId,
          view: updatedModal,
        }),
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${slackAccessToken}`,
        },
      });
    } catch (error) {
      console.log(error);
      logger.error(error);
    }
  }
}
