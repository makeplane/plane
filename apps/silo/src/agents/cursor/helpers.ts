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

import crypto from "crypto";
import { marked } from "marked";
import type { TWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";

/**
 * Strip HTML tags to get plain text.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Build the prompt text for a Cursor agent launch.
 * Includes issue metadata (title + description) for full context on initial runs.
 */
export function buildCursorPrompt(
  htmlBody: string,
  issueContext?: { title: string; descriptionHtml?: string }
): string {
  const userMessage = stripHtml(htmlBody);

  if (!issueContext) {
    return userMessage;
  }

  const parts: string[] = [];

  parts.push(`Issue: ${issueContext.title}`);

  if (issueContext.descriptionHtml) {
    const description = stripHtml(issueContext.descriptionHtml);
    if (description) {
      parts.push(`Description:\n${description}`);
    }
  }

  if (userMessage) {
    parts.push(`Instructions:\n${userMessage}`);
  }

  return parts.join("\n\n");
}

/**
 * Build the full callback URL for Cursor webhooks, with query params for correlation.
 */
export function getWebhookCallbackUrl(params: { workspaceConnectionId: string; workspaceId: string }): string {
  const basePath = env.SILO_BASE_PATH || "";
  const baseUrl = `${env.SILO_API_BASE_URL}${basePath}/api/agents/cursor/webhook`;
  const query = new URLSearchParams({
    wc_id: params.workspaceConnectionId,
    ws_id: params.workspaceId,
  });
  return `${baseUrl}?${query.toString()}`;
}

/**
 * Verify the Cursor webhook signature.
 * Cursor sends `X-Webhook-Signature: sha256=<hex_digest>` header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Convert markdown to HTML so Plane's LiteTextEditor (Tiptap/ProseMirror) can render it.
 * Strips newlines from the resulting HTML since Tiptap uses tags for structure, not whitespace.
 */
export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return html.replace(/\n/g, "");
}

/**
 * Extract the Cursor API key from a workspace credential.
 */
export function getCursorApiKey(credential: TWorkspaceCredential): string | null {
  return credential.source_access_token || null;
}

/**
 * Extract the default repository configuration from a workspace connection's connection_data.
 */
export function getDefaultRepository(
  workspaceConnection: TWorkspaceConnection
): { repository: string; ref?: string } | null {
  const data = workspaceConnection.connection_data as Record<string, unknown> | null;
  if (!data || typeof data.default_repository !== "string") {
    return null;
  }
  return {
    repository: data.default_repository,
    ref: typeof data.default_ref === "string" ? data.default_ref : undefined,
  };
}
