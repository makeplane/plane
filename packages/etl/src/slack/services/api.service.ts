import axios, { AxiosInstance } from "axios";
import {
  SlackConversationHistoryResponse,
  SlackMessageResponse,
  SlackTokenRefreshResponse,
  SlackUserResponse,
  UnfurlMap,
} from "../types";
import { SlackAuthService } from "./auth.service";

export class SlackService {
  private client: AxiosInstance;

  constructor(
    access_token: string,
    refresh_token: string,
    authService: SlackAuthService,
    authCallback: (tokenResponse: SlackTokenRefreshResponse) => Promise<void>
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

        if (!response.ok) {
          throw new Error("Failed to refresh token, returning error", {
            cause: response,
          });
        }

        await authCallback(response);
        this.client.defaults.headers.Authorization = `Bearer ${response.access_token}`;
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

      // If we fail to ensure bot is in channel, make an attempt to join the channel
      if (!response.data?.channel?.is_member) {
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
    threadTs?: string, // Optional parameter for thread timestamp
    blocks?: any[] // Optional blocks parameter
  ) {
    try {
      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        throw new Error("Could not add bot to channel");
      }

      const payload: any = {
        user: userId,
        channel: channelId,
        text: text, // Always include text for fallback
      };

      // Include thread_ts if provided
      if (threadTs) {
        payload.thread_ts = threadTs;
      }

      // Include blocks if provided
      if (blocks && blocks.length > 0) {
        payload.blocks = blocks;
      }

      const res = await this.client.post("chat.postEphemeral", payload);
      return res.data;
    } catch (error) {
      console.error(error);
      throw error; // Re-throw the error for better error handling
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
            unfurl_media: unfurlLinks,
          }
          : {
            channel: channelId,
            thread_ts: threadTs,
            metadata: {
              event_type: "issue",
              event_payload: metadata,
            },
            unfurl_links: unfurlLinks,
            unfurl_media: unfurlLinks,
            ...message,
          };

      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        // If the bot is not in the channel, log it, but make the request anyway
        console.log("Could not add bot to channel");
      }

      const response = await this.client.post("chat.postMessage", payload);
      return response.data;
    } catch (error) {
      console.error("Error sending thread message:", error);
      throw error;
    }
  }

  async sendMessage(webhookUrl: string, template: { text: string; blocks: any[] }) {
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

  async sendMessageToChannel(
    channelId: string,
    message: { text?: string; blocks?: any[] }
  ): Promise<SlackMessageResponse> {
    try {
      // Check if bot is in channel
      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        throw new Error("Could not add bot to channel");
      }

      const response = await this.client.post("chat.postMessage", {
        channel: channelId,
        text: message.text,
        blocks: message.blocks,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateMessage(channel: string, ts: string, text: string, blocks?: any[]): Promise<SlackMessageResponse> {
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

  async getMessage(channel: string, messageTs: string): Promise<SlackConversationHistoryResponse | undefined> {
    try {
      const response = await this.client.get("conversations.history", {
        params: {
          channel: channel,
          latest: messageTs,
          inclusive: true,
          limit: 1,
        },
      });

      return response.data;
    } catch (error) {
      console.error(error);
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

  async getChannels() {
    try {
      const allChannels = [];
      let cursor = undefined;
      const types = "public_channel,private_channel";

      do {
        // Prepare parameters for pagination
        const params: any = {
          types,
          exclude_archived: true,
          limit: 999,
          ...(cursor ? { cursor } : {}),
        };

        // Make the API request with cursor if available
        const response = await this.client.get("conversations.list", { params });

        // Add channels from this page to our result array
        if (response.data && response.data.channels && Array.isArray(response.data.channels)) {
          allChannels.push(...response.data.channels);
        }

        // Get the next cursor if available
        cursor = response.data?.response_metadata?.next_cursor || null;
      } while (cursor); // Continue fetching if there's a next page

      // Return the combined results with the same structure
      return {
        ok: true,
        channels: allChannels,
      };
    } catch (error) {
      return {
        ok: false,
        channels: [],
        error: error instanceof Error ? error.message : "Failed to fetch Slack channels",
      };
    }
  }
}
