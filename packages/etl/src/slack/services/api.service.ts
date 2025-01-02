import { SlackAuthService } from "./auth.service";
import axios, { AxiosInstance } from "axios";
import {
  isSlackBotTokenResponse,
  SlackMessageResponse,
  SlackUpdateCredential,
  SlackUserResponse,
  UnfurlMap,
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
    }: SlackUpdateCredential) => Promise<void>
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

  async ensureBotInChannel(channelId: string): Promise<boolean> {
    try {
      // Check if bot is in channel
      const response = await this.client.get("conversations.info", {
        params: { channel: channelId },
      });

      if (!response.data.channel.is_member) {
        // Join the channel if not a member
        await this.client.post("conversations.join", {
          channel: channelId,
        });
      }
      return true;
    } catch (error) {
      console.error("Error ensuring bot in channel:", error);
      return false;
    }
  }

  async sendEphemeralMessage(
    userId: string,
    text: string,
    channelId: string,
    threadTs?: string // Optional parameter for thread timestamp
  ) {
    try {
      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        throw new Error("Could not add bot to channel");
      }

      const payload: any = {
        user: userId,
        channel: channelId,
        text: text,
      };

      // Include thread_ts if provided
      if (threadTs) {
        payload.thread_ts = threadTs;
      }

      const res = await this.client.post("chat.postEphemeral", payload);
      console.log(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  async getUserInfo(userId: string): Promise<SlackUserResponse | undefined> {
    try {
      const response = await this.client.get("users.info", {
        params: { user: userId },
      });

      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async unfurlLink(channel: string, ts: string, unfurls: UnfurlMap) {
    try {
      const response = await this.client.post("chat.unfurl", {
        channel,
        ts,
        unfurls,
      });

      return response.data;
    } catch (error) {
      console.error("Error unfurling link:", error);
      return false;
    }
  }

  async sendMessageAsUser(
    channelId: string,
    threadTs: string,
    message: string | { text?: string; blocks?: any[] },
    userToken: string, // Add a parameter for the user token
    metadata?: any
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

      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        throw new Error("Could not add bot to channel");
      }

      // Use the user token to authenticate the request
      const response = await this.client.post("chat.postMessage", payload, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error sending thread message:", error);
      throw error;
    }
  }

  async sendThreadMessage(
    channelId: string,
    threadTs: string,
    message: string | { text?: string; blocks?: any[] },
    metadata?: any,
    unfurlLinks = true
  ): Promise<SlackMessageResponse> {
    try {
      const payload =
        typeof message === "string"
          ? {
              channel: channelId,
              thread_ts: threadTs,
              metadata: metadata,
              text: message,
              unfurl_links: unfurlLinks,
            }
          : {
              channel: channelId,
              thread_ts: threadTs,
              metadata: {
                event_type: "issue",
                event_payload: metadata,
              },
              unfurl_links: unfurlLinks,
              ...message,
            };

      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        throw new Error("Could not add bot to channel");
      }

      const response = await this.client.post("chat.postMessage", payload);
      return response.data;
    } catch (error) {
      console.error("Error sending thread message:", error);
      throw error;
    }
  }

  async sendMessage(
    webhookUrl: string,
    template: { text: string; blocks: any[] }
  ) {
    try {
      await axios.post(webhookUrl, template, {
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    blocks?: any[],
  ): Promise<SlackMessageResponse> {
    try {
      const response = await this.client.post("chat.update", {
        channel,
        ts,
        text,
        blocks,
      });

      return response.data;
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
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
      console.error(error);
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
      console.error(error);
    }
  }
}
