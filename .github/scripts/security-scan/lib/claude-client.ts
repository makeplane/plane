import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Finding } from "../types";

export const CLAUDE_MODEL = "claude-sonnet-5";

const MAX_RESPONSE_TOKENS = 4096;
const REPORT_FINDINGS_TOOL_NAME = "report_findings";

const findingInputSchema = z.object({
  file: z.string(),
  lineStart: z.number().int(),
  lineEnd: z.number().int(),
  description: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  severity: z.enum(["low", "medium", "high"]),
});

const reportFindingsInputSchema = z.object({
  findings: z.array(findingInputSchema),
});

const REPORT_FINDINGS_TOOL: Anthropic.Tool = {
  name: REPORT_FINDINGS_TOOL_NAME,
  description: "Report every finding discovered while reviewing the given content for this check.",
  input_schema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            file: { type: "string" },
            lineStart: { type: "integer" },
            lineEnd: { type: "integer" },
            description: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            severity: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["file", "lineStart", "lineEnd", "description", "confidence", "severity"],
        },
      },
    },
    required: ["findings"],
  },
};

export interface MinimalAnthropicClient {
  messages: {
    create: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;
  };
}

export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export interface CallCheckParams {
  readonly checkId: string;
  readonly prompt: string;
  readonly content: string;
}

export interface CallCheckResult {
  readonly findings: Finding[];
  readonly error: string | null;
}

function isToolUseBlock(block: Anthropic.Message["content"][number]): block is Anthropic.ToolUseBlock {
  return block.type === "tool_use" && block.name === REPORT_FINDINGS_TOOL_NAME;
}

export async function callCheck(client: MinimalAnthropicClient, params: CallCheckParams): Promise<CallCheckResult> {
  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_RESPONSE_TOKENS,
      system: params.prompt,
      messages: [{ role: "user", content: params.content }],
      tools: [REPORT_FINDINGS_TOOL],
      tool_choice: { type: "tool", name: REPORT_FINDINGS_TOOL_NAME },
    });

    const toolUseBlock = response.content.find(isToolUseBlock);
    if (!toolUseBlock) {
      return { findings: [], error: `no ${REPORT_FINDINGS_TOOL_NAME} tool call in response` };
    }

    const parsed = reportFindingsInputSchema.safeParse(toolUseBlock.input);
    if (!parsed.success) {
      return { findings: [], error: `malformed tool response: ${parsed.error.message}` };
    }

    const findings: Finding[] = parsed.data.findings.map((finding) => ({
      checkId: params.checkId,
      file: finding.file,
      lineStart: finding.lineStart,
      lineEnd: finding.lineEnd,
      description: finding.description,
      confidence: finding.confidence,
      severity: finding.severity,
    }));

    return { findings, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { findings: [], error: `Claude API call failed: ${message}` };
  }
}
