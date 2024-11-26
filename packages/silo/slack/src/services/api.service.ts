import { logger } from "@sentry/utils";
import { SlackAuthService } from "./auth.service";
import axios, { AxiosInstance } from "axios";
import {
  isSlackBotTokenResponse,
  SlackMessageResponse,
  SlackUpdateCredential,
  SlackUserResponse,
} from "../types";

export class SlackService {
  private client: AxiosInstance;

  constructor(
    access_token: string,
    refresh_token: string,
    authService: SlackAuthService,
    authCallback: ({
      isBotToken,
      tokenResponse,
    }: SlackUpdateCredential) => Promise<void>,
  ) {
    this.client = axios.create({
      baseURL: "https://slack.com/api/",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "content-type": "application/json",
      },
    });

    this.client.interceptors.response.use(async (request) => {
      if (
        (request.data.ok === false && request.data.error === "token_expired") ||
        request.data.error === "invalid_auth"
      ) {
        const response = await authService.refreshToken(refresh_token);
        let new_access_token: string;

        if (isSlackBotTokenResponse(response)) {
          new_access_token = response.access_token;
          await authCallback({ isBotToken: true, tokenResponse: response });
        } else {
          new_access_token = response.authed_user.access_token;
          await authCallback({ isBotToken: false, tokenResponse: response });
        }

        this.client.defaults.headers.Authorization = `Bearer ${new_access_token}`;
        const resp = await this.client.request(request);
        return resp;
      } else {
        return request;
      }
    });
  }

  async sendEphemeralMessage(
    userId: string,
    text: string,
    channelId: string,
    threadTs?: string, // Optional parameter for thread timestamp
  ) {
    try {
      const payload: any = {
        user: userId,
        channel: channelId,
        text: text,
      };

      // Include thread_ts if provided
      if (threadTs) {
        payload.thread_ts = threadTs;
      }

      await this.client.post("chat.postEphemeral", payload);
    } catch (error) {
      logger.error(error);
    }
  }

  async getUserInfo(userId: string): Promise<SlackUserResponse | undefined> {
    try {
      const response = await this.client.get("users.info", {
        params: { user: userId },
      });

      return response.data;
    } catch (error) {
      logger.error(error);
    }
  }

  async sendMessageAsUser(
    channelId: string,
    threadTs: string,
    message: string | { text?: string; blocks?: any[] },
    userToken: string, // Add a parameter for the user token
    metadata?: any,
  ): Promise<SlackMessageResponse> {
    try {
      const payload =
        typeof message === "string"
          ? {
              channel: channelId,
              thread_ts: threadTs,
              metadata: metadata,
              text: message,
            }
          : {
              channel: channelId,
              thread_ts: threadTs,
              metadata: {
                event_type: "issue",
                event_payload: metadata,
              },
              ...message,
            };

      // Use the user token to authenticate the request
      const response = await this.client.post("chat.postMessage", payload, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error("Error sending thread message:", error);
      throw error;
    }
  }

  async sendThreadMessage(
    channelId: string,
    threadTs: string,
    message: string | { text?: string; blocks?: any[] },
    metadata?: any,
  ): Promise<SlackMessageResponse> {
    try {
      const payload =
        typeof message === "string"
          ? {
              channel: channelId,
              thread_ts: threadTs,
              metadata: metadata,
              text: message,
            }
          : {
              channel: channelId,
              thread_ts: threadTs,
              metadata: {
                event_type: "issue",
                event_payload: metadata,
              },
              ...message,
            };

      const response = await this.client.post("chat.postMessage", payload);
      return response.data;
    } catch (error) {
      logger.error("Error sending thread message:", error);
      throw error;
    }
  }

  async sendMessage(
    webhookUrl: string,
    template: { text: string; blocks: any[] },
  ) {
    try {
      await axios.post(webhookUrl, template, {
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      logger.error(error);
    }
  }

  async openModal(triggerId: string, modal: any) {
    try {
      const res = await this.client.post("views.open", {
        trigger_id: triggerId,
        view: modal,
      });
      return res.data;
    } catch (error) {
      logger.error(error);
    }
  }

  async updateModal(viewId: string, updatedModal: any) {
    try {
      const res = await this.client.post("views.update", {
        view_id: viewId,
        view: updatedModal,
      });

      return res.data;
    } catch (error) {
      logger.error(error);
    }
  }
}
