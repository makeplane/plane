/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { AxiosInstance } from "axios";
import axios from "axios";
import type {
  Message,
  SlackConversationHistoryResponse,
  SlackConversationInfoResponse,
  SlackMessageResponse,
  SlackTokenRefreshResponse,
  SlackUserLookupByEmailResponse,
  SlackUserResponse,
  UnfurlMap,
} from "../types";
import type { SlackAuthService } from "./auth.service";

/* oxlint-disable @typescript-eslint/no-explicit-any */

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

    this.client.interceptors.response.use(async (currentResponse) => {
      const originalRequest = currentResponse.config;
      const responseData = currentResponse.data as { ok: boolean; error: string };

      if (responseData.ok === false) {
        console.log("Slack request error", {
          error: responseData.error,
          request: {
            url: originalRequest.url,
          },
        });
      }

      if (
        responseData.ok === false &&
        ["token_expired", "token_revoked", "invalid_auth"].includes(responseData.error)
      ) {
        const response = await authService.refreshToken(refresh_token);

        if (!response.ok) {
          throw new Error("Failed to refresh token, returning error", {
            cause: response,
          });
        }

        console.log("Refreshed Slack token for user");

        await authCallback(response);

        const newAuthHeader = `Bearer ${response.access_token}`;

        this.client.defaults.headers.Authorization = newAuthHeader;

        originalRequest.headers.Authorization = newAuthHeader;

        const resp = await this.client.request(originalRequest);
        return resp;
      } else {
        return currentResponse;
      }
    });
  }

  async getConversationInfo(channelId: string): Promise<SlackConversationInfoResponse> {
    // Check if bot is in channel
    try {
      const response = await this.client.get("conversations.info", {
        params: { channel: channelId },
      });

      return response.data as SlackConversationInfoResponse;
    } catch (error) {
      console.error("Error while getting conversation info", error);
      throw error;
    }
  }

  async ensureBotInChannel(channelId: string): Promise<boolean> {
    try {
      // Check if bot is in channel
      const response = await this.getConversationInfo(channelId);

      // If we fail to ensure bot is in channel, make an attempt to join the channel
      if (response.channel && response.channel.is_channel === true && response.channel.is_member === false) {
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
        console.error("Could not add bot to channel", { channelId });
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

  async unfurlLink(
    channel: string,
    ts: string,
    unfurls: UnfurlMap,
    metadata?: { entities: { app_unfurl_url: string }[] }
  ) {
    try {
      const response = await this.client.post("chat.unfurl", {
        channel,
        ts,
        unfurls,
        metadata,
      });

      return response.data;
    } catch (error) {
      console.error("Error unfurling link:", error);
      return false;
    }
  }

  async unfurlWithWorkObject(channel: string, ts: string, metadata: { entities: { app_unfurl_url: string }[] }) {
    try {
      const response = await this.client.post("chat.unfurl", {
        channel,
        ts,
        metadata,
      });

      return response.data;
    } catch (error) {
      console.error("Error unfurling link:", error);
      return false;
    }
  }

  async entityPresentDetails(
    triggerId: string,
    props: {
      metadata?: any;
      userAuthRequired?: boolean;
      userAuthUrl?: string;
      error?: {
        custom_title?: string;
        custom_message?: string;
        status: "edit_error" | "custom" | "not_found" | "internal_error";
      };
    }
  ) {
    try {
      const response = await this.client.post("entity.presentDetails", {
        trigger_id: triggerId,
        metadata: props.metadata,
        user_auth_required: props.userAuthRequired,
        user_auth_url: props.userAuthUrl,
        error: props.error,
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
        console.error("Could not add bot to channel", { channelId });
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
    unfurlLinks = false
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
        console.error("Could not add bot to channel", { channelId });
      }

      const response = await this.client.post("chat.postMessage", payload);
      return response.data;
    } catch (error) {
      console.error("Error sending thread message:", error);
      throw error;
    }
  }

  async sendWorkObjectThreadMessage(
    channelId: string,
    text: string,
    threadTs?: string,
    metadata?: any,
    unfurlLinks = false
  ): Promise<SlackMessageResponse> {
    try {
      const payload = {
        channel: channelId,
        text: text,
        thread_ts: threadTs,
        metadata: metadata as unknown,
        unfurl_links: unfurlLinks,
        unfurl_media: unfurlLinks,
      };

      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        // If the bot is not in the channel, log it, but make the request anyway
        console.error("Could not add bot to channel", { channelId });
      }

      const response = await this.client.post("chat.postMessage", payload);
      return response.data as SlackMessageResponse;
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
    message: { text?: string; blocks?: any[] },
    unfurlLinks = false
  ): Promise<SlackMessageResponse> {
    try {
      // Check if bot is in channel
      const isBotInChannel = await this.ensureBotInChannel(channelId);
      if (!isBotInChannel) {
        console.error("Could not add bot to channel", { channelId });
      }

      const response = await this.client.post("chat.postMessage", {
        channel: channelId,
        text: message.text,
        blocks: message.blocks,
        unfurl_links: unfurlLinks,
        unfurl_media: unfurlLinks,
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

  async userLookupByEmail(email: string): Promise<SlackUserLookupByEmailResponse> {
    try {
      const response = await this.client.get("users.lookupByEmail", {
        params: { email },
      });

      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
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

  async addReaction(channel: string, ts: string, emojiName: string) {
    await this.client.post("reactions.add", {
      channel,
      timestamp: ts,
      name: emojiName,
    });
  }

  async removeReaction(channel: string, ts: string, emojiName: string) {
    await this.client.post("reactions.remove", {
      channel,
      timestamp: ts,
      name: emojiName,
    });
  }

  async fetchPreviousMessagesInThread(channel: string, threadTs: string): Promise<Message[]> {
    try {
      const response = await this.client.get("conversations.replies", {
        params: {
          channel: channel,
          ts: threadTs,
          limit: 20,
        },
      });

      const threadedMessagesResponse: SlackConversationHistoryResponse = response.data;

      return threadedMessagesResponse.messages || [];
    } catch (error) {
      console.error("Error fetching all messages in thread:", error);
      throw error;
    }
  }
}
