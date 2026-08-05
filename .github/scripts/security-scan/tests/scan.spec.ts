import { describe, expect, it, vi } from "vitest";
import { runScan } from "../lib/scan";
import type { MinimalAnthropicClient } from "../lib/claude-client";
import type { Check, ContentItem } from "../types";

const CHECK: Check = {
  id: "test_check",
  description: "test check",
  targetGlobs: ["apps/api/plane/**/views/**/*.py"],
  prompt: "detection rule",
};

function clientReturning(findings: unknown[] = []): {
  client: MinimalAnthropicClient;
  create: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn().mockResolvedValue({
    content: [{ type: "tool_use", name: "report_findings", input: { findings } }],
  });
  return { client: { messages: { create } }, create };
}

function item(path: string, size = 10): ContentItem {
  return { path, content: "x".repeat(size) };
}

const MATCHING = "apps/api/plane/app/views/member.py";
const NON_MATCHING = "apps/web/core/components/settings.tsx";

describe("runScan", () => {
  it("skips a check with no matching files without calling the API", async () => {
    const { client, create } = clientReturning();

    const result = await runScan({
      client,
      checks: [CHECK],
      items: [item(NON_MATCHING)],
      mode: "pr",
    });

    expect(result[0]?.status).toBe("skipped_no_matching_files");
    expect(create).not.toHaveBeenCalled();
  });

  it("returns findings tagged with the check id for matching files", async () => {
    const { client } = clientReturning([
      {
        file: MATCHING,
        lineStart: 1,
        lineEnd: 2,
        description: "unverified member_id",
        confidence: "high",
        severity: "high",
      },
    ]);

    const result = await runScan({ client, checks: [CHECK], items: [item(MATCHING)], mode: "pr" });

    expect(result[0]?.status).toBe("ok");
    expect(result[0]?.findings).toHaveLength(1);
    expect(result[0]?.findings[0]?.checkId).toBe("test_check");
  });

  it("skips a PR-mode check whose matched content exceeds the cap, without calling the API", async () => {
    const { client, create } = clientReturning();

    const result = await runScan({
      client,
      checks: [CHECK],
      items: [item(MATCHING, 500)],
      mode: "pr",
      maxChars: 100,
    });

    expect(result[0]?.status).toBe("skipped_too_large");
    expect(create).not.toHaveBeenCalled();
  });

  it("makes one API call per chunk in full mode instead of skipping oversized sets", async () => {
    const { client, create } = clientReturning();

    const result = await runScan({
      client,
      checks: [CHECK],
      items: [item(MATCHING, 40), item("apps/api/plane/app/views/other.py", 40)],
      mode: "full",
      maxChars: 50,
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(result[0]?.status).toBe("ok");
  });

  it("records an individually oversized file as skipped in full mode but still scans the rest", async () => {
    const { client, create } = clientReturning();

    const result = await runScan({
      client,
      checks: [CHECK],
      items: [item(MATCHING, 500), item("apps/api/plane/app/views/small.py", 10)],
      mode: "full",
      maxChars: 100,
    });

    expect(result[0]?.skippedPaths).toEqual([MATCHING]);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("frames PR-mode content as a diff", async () => {
    const { client, create } = clientReturning();

    await runScan({ client, checks: [CHECK], items: [item(MATCHING)], mode: "pr" });

    expect(create.mock.calls[0]?.[0]?.messages[0]?.content).toContain("diff");
  });

  it("frames full-mode content as complete files", async () => {
    const { client, create } = clientReturning();

    await runScan({ client, checks: [CHECK], items: [item(MATCHING)], mode: "full" });

    expect(create.mock.calls[0]?.[0]?.messages[0]?.content).toContain("complete contents");
  });

  it("reports a check as errored without throwing when the API call fails", async () => {
    const client: MinimalAnthropicClient = {
      messages: { create: vi.fn().mockRejectedValue(new Error("network down")) },
    };

    const result = await runScan({ client, checks: [CHECK], items: [item(MATCHING)], mode: "pr" });

    expect(result[0]?.status).toBe("errored");
    expect(result[0]?.errors[0]).toContain("network down");
  });

  it("isolates an unexpected failure in one check from the others", async () => {
    const exploding: Check = {
      ...CHECK,
      id: "exploding_check",
      get targetGlobs(): string[] {
        throw new Error("registry blew up");
      },
    };
    const { client } = clientReturning();

    const result = await runScan({
      client,
      checks: [exploding, CHECK],
      items: [item(MATCHING)],
      mode: "pr",
    });

    expect(result[0]?.status).toBe("errored");
    expect(result[1]?.status).toBe("ok");
  });
});
