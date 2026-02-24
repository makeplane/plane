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

import type { TSlackContentParserConfig } from ".";
import { getSlackContentParser } from ".";
import type { SlackService } from "@plane/etl/slack";

/**
 * Creates a mock SlackService for testing purposes
 * Provides stub implementations for getUserInfo and getConversationInfo
 */
const createMockSlackService = () =>
  ({
    getUserInfo: jest.fn((userId: string) =>
      Promise.resolve({
        ok: true,
        user: {
          id: userId,
          real_name: `Mock User ${userId}`,
          name: `user_${userId}`,
        },
      })
    ),
    getConversationInfo: jest.fn((channelId: string) =>
      Promise.resolve({
        ok: true,
        channel: {
          id: channelId,
          name: channelId.toLowerCase(),
          is_channel: true,
          is_member: true,
        },
      })
    ),
  }) as unknown as SlackService;

const normalizeMentionIds = (html: string) => html.replace(/id="[a-f0-9-]{36}"/g, 'id="<uuid>"');

describe("Slack Content Parser", () => {
  const mockConfig: TSlackContentParserConfig = {
    slackService: createMockSlackService(),
    userMap: new Map([
      ["U123456789", "plane-user-id-1"],
      ["U987654321", "plane-user-id-2"],
    ]),
    teamDomain: "myteam",
  };

  it("should parse Slack rich text with user mentions, channel mentions, and broadcasts", async () => {
    const slackRichText = `
Hello @U123456789 and @U987654321!

Please check the #C1234567890 channel for updates.

!channel announcement for everyone.

Visit our website: https://example.com

Here's a formatted link: [Click here](https://plane.so)

Some **bold text** and *italic text* and \`inline code\`.

- First item
- Second item
- Third item
    `.trim();

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    expect(normalizeMentionIds(result)).toMatchInlineSnapshot(`
      "<p>Hello <mention-component id="<uuid>" entity_identifier="plane-user-id-1" entity_name="user_mention"></mention-component> and <mention-component id="<uuid>" entity_identifier="plane-user-id-2" entity_name="user_mention"></mention-component>!</p>
      <p>Please check the <a href="https%3A%2F%2Fmyteam.slack.com%2Farchives%2FC1234567890" target="_blank">c1234567890</a> channel for updates.</p>
      <p><a href="https%3A%2F%2Fmyteam.slack.com%2Fteam%2Fchannel" target="_blank">Slack Broadcast: channel</a> announcement for everyone.</p>
      <p>Visit our website: <a href="https://example.com">https://example.com</a></p>
      <p>Here&#39;s a formatted link: <a href="https://plane.so">Click here</a></p>
      <p>Some <strong>bold text</strong> and <em>italic text</em> and <code>inline code</code>.</p>
      <ul>
      <li>First item</li>
      <li>Second item</li>
      <li>Third item</li>
      </ul>
      "
    `);
  });

  it("should handle user mentions with fallback for unmapped users", async () => {
    const slackRichText = "Hey @U111111111, can you help @U123456789?";

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    // Should map known user and create link for unknown user
    expect(result).toMatch(
      /<mention-component id="[a-f0-9-]{36}" entity_identifier="plane-user-id-1" entity_name="user_mention"><\/mention-component>/
    );
    expect(result).toContain("https%3A%2F%2Fmyteam.slack.com%2Fteam%2FU111111111");
  });

  it("should handle channel mentions with fallback links", async () => {
    const slackRichText = "Check #C1234567890 and #C0987654321 channels";

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    // Should create links for channels since entityMap is empty
    expect(result).toContain("https%3A%2F%2Fmyteam.slack.com%2Farchives%2FC1234567890");
    expect(result).toContain("https%3A%2F%2Fmyteam.slack.com%2Farchives%2FC0987654321");
  });

  it("should handle broadcast mentions", async () => {
    const slackRichText = "Attention !here and !channel";

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    // Should create links for broadcasts
    expect(result).toContain("https%3A%2F%2Fmyteam.slack.com%2Fteam%2Fhere");
    expect(result).toContain("https%3A%2F%2Fmyteam.slack.com%2Fteam%2Fchannel");
  });

  it("should handle mixed content with multiple mention types", async () => {
    const slackRichText = `
  Team update from @U123456789:

  1. Check #general for announcements
  2. !everyone please review the docs
  3. Contact @U987654321 for questions

  Link: https://docs.example.com
      `.trim();

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    expect(normalizeMentionIds(result)).toMatchInlineSnapshot(`
      "<p>Team update from <mention-component id="<uuid>" entity_identifier="plane-user-id-1" entity_name="user_mention"></mention-component>:</p>
      <ol>
      <li>Check <a href="https%3A%2F%2Fmyteam.slack.com%2Farchives%2Fgeneral" target="_blank">general</a> for announcements</li>
      <li><a href="https%3A%2F%2Fmyteam.slack.com%2Fteam%2Feveryone" target="_blank">Slack Broadcast: everyone</a> please review the docs</li>
      <li>Contact <mention-component id="<uuid>" entity_identifier="plane-user-id-2" entity_name="user_mention"></mention-component> for questions</li>
      </ol>
      <p>  Link: <a href="https://docs.example.com">https://docs.example.com</a></p>
      "
    `);
  });

  it("should preserve markdown formatting in non-mention text", async () => {
    const slackRichText = `
  **Bold text** and *italic text*

  \`Code snippet\`

  > Quote block

  - List item 1
  - List item 2
      `.trim();

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    // Should preserve markdown formatting
    expect(result).toContain("<strong>Bold text</strong>");
    expect(result).toContain("<em>italic text</em>");
    expect(result).toContain("<code>Code snippet</code>");
    expect(result).toContain("<blockquote>\n<p>Quote block</p>\n</blockquote>");
    expect(result).toContain("<li>List item 1</li>");
    expect(result).toContain("<li>List item 2</li>");
  });

  it("should handle complex Slack message with rich text elements", async () => {
    const slackRichText = `
  Hi @U123456789! 👋

  Please review the PR in #dev-team channel.

  !here - This is important for everyone.

  Resources:
  - Documentation: https://docs.plane.so
  - Support: [Contact us](https://plane.so/contact)

  Thanks!
      `.trim();

    const parser = getSlackContentParser(mockConfig);
    const result = await parser.toPlaneHtml(slackRichText);

    expect(normalizeMentionIds(result)).toMatchInlineSnapshot(`
      "<p>Hi <mention-component id="<uuid>" entity_identifier="plane-user-id-1" entity_name="user_mention"></mention-component>! 👋</p>
      <p>  Please review the PR in <a href="https%3A%2F%2Fmyteam.slack.com%2Farchives%2Fdev-team" target="_blank">dev-team</a> channel.</p>
      <p>  <a href="https%3A%2F%2Fmyteam.slack.com%2Fteam%2Fhere" target="_blank">Slack Broadcast: here</a> - This is important for everyone.</p>
      <p>  Resources:</p>
      <ul>
      <li>Documentation: <a href="https://docs.plane.so">https://docs.plane.so</a></li>
      <li>Support: <a href="https://plane.so/contact">Contact us</a></li>
      </ul>
      <p>  Thanks!</p>
      "
    `);
  });
});
