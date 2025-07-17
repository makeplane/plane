import { getSlackContentParser, TSlackContentParserConfig } from ".";

describe("Slack Content Parser", () => {
  const mockConfig: TSlackContentParserConfig = {
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

    // Test mention components structure (with UUID pattern matching)
    expect(result).toMatch(
      /<mention-component id="[a-f0-9-]{36}" entity_identifier="plane-user-id-1" entity_name="user_mention"><\/mention-component>/
    );
    expect(result).toMatch(
      /<mention-component id="[a-f0-9-]{36}" entity_identifier="plane-user-id-2" entity_name="user_mention"><\/mention-component>/
    );

    // Test channel mentions
    expect(result).toContain('href="https%3A%2F%2Fmyteam.slack.com%2Farchives%2FC1234567890"');
    expect(result).toContain("Slack Channel: C1234567890");

    // Test broadcast mentions
    expect(result).toContain('href="https%3A%2F%2Fmyteam.slack.com%2Fteam%2Fchannel"');
    expect(result).toContain("Slack Broadcast: channel");

    // Test regular links
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('href="https://plane.so"');

    // Test text formatting
    expect(result).toContain("<strong>bold text</strong>");
    expect(result).toContain("<em>italic text</em>");
    expect(result).toContain("<code>inline code</code>");

    // Test list structure
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>First item</li>");
    expect(result).toContain("<li>Second item</li>");
    expect(result).toContain("<li>Third item</li>");
    expect(result).toContain("</ul>");
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

    // Verify all mention types are processed
    expect(result).toContain('entity_identifier="plane-user-id-1"'); // Mapped user
    expect(result).toContain('entity_identifier="plane-user-id-2"'); // Mapped user
    expect(result).toContain("Slack Channel: general"); // Channel mention
    expect(result).toContain("Slack Broadcast: everyone"); // Broadcast mention
    expect(result).toContain("https://docs.example.com"); // Regular link
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

    // Verify the structure is maintained and all elements are processed
    //
    expect(result).toMatch(
      /<mention-component id="[a-f0-9-]{36}" entity_identifier="plane-user-id-1" entity_name="user_mention"><\/mention-component>/
    );
    expect(result).toContain("Slack Channel: dev-team");
    expect(result).toContain("Slack Broadcast: here");
    expect(result).toContain('<a href="https://docs.plane.so">https://docs.plane.so</a>');
  });
});
