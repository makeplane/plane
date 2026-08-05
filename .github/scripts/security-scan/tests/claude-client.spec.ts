import { describe, expect, it, vi } from "vitest";
import { CLAUDE_MODEL, callCheck, type MinimalAnthropicClient } from "../lib/claude-client";

function mockClient(create: MinimalAnthropicClient["messages"]["create"]): MinimalAnthropicClient {
  return { messages: { create } };
}

describe("callCheck", () => {
  it("parses a well-formed report_findings tool call into Findings", async () => {
    const client = mockClient(
      vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "report_findings",
            input: {
              findings: [
                {
                  file: "apps/api/plane/app/views/member.py",
                  lineStart: 12,
                  lineEnd: 14,
                  description: "member_id from the request body is not checked against the workspace.",
                  confidence: "high",
                  severity: "high",
                },
              ],
            },
          },
        ],
      })
    );

    const result = await callCheck(client, {
      checkId: "multi_tenancy_isolation",
      prompt: "detection rule prompt",
      content: "diff content",
    });

    expect(result.error).toBeNull();
    expect(result.findings).toEqual([
      {
        checkId: "multi_tenancy_isolation",
        file: "apps/api/plane/app/views/member.py",
        lineStart: 12,
        lineEnd: 14,
        description: "member_id from the request body is not checked against the workspace.",
        confidence: "high",
        severity: "high",
      },
    ]);
  });

  it("sends the model, forced tool choice, system prompt, and content in the request", async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ type: "tool_use", name: "report_findings", input: { findings: [] } }],
    });
    const client = mockClient(create);

    await callCheck(client, {
      checkId: "multi_tenancy_isolation",
      prompt: "detection rule prompt",
      content: "diff content",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: CLAUDE_MODEL,
        system: "detection rule prompt",
        messages: [{ role: "user", content: "diff content" }],
        tool_choice: { type: "tool", name: "report_findings" },
      })
    );
  });

  it("returns an error and no findings when the response has no report_findings tool call", async () => {
    const client = mockClient(
      vi.fn().mockResolvedValue({ content: [{ type: "text", text: "I looked but found nothing" }] })
    );

    const result = await callCheck(client, {
      checkId: "multi_tenancy_isolation",
      prompt: "prompt",
      content: "content",
    });

    expect(result.findings).toEqual([]);
    expect(result.error).toContain("report_findings");
  });

  it("returns an error and no findings when the tool call input fails schema validation", async () => {
    const client = mockClient(
      vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "report_findings",
            input: { findings: [{ file: "a.py", confidence: "extremely-high" }] },
          },
        ],
      })
    );

    const result = await callCheck(client, {
      checkId: "multi_tenancy_isolation",
      prompt: "prompt",
      content: "content",
    });

    expect(result.findings).toEqual([]);
    expect(result.error).not.toBeNull();
  });

  it("never throws when the underlying SDK call rejects", async () => {
    const client = mockClient(vi.fn().mockRejectedValue(new Error("network down")));

    const result = await callCheck(client, {
      checkId: "multi_tenancy_isolation",
      prompt: "prompt",
      content: "content",
    });

    expect(result.findings).toEqual([]);
    expect(result.error).toContain("network down");
  });
});
