/**
 * Durable multi-step pipeline over one contract: text extraction → embeddings
 * → AI analysis (3 parallel subtasks) → thumbnail → finalize. Mirrors the
 * crm-new reference orchestrator step-for-step; each phase is an
 * independently-retriable step.do() whose return value is persisted.
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent, WorkflowStepConfig } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";

import { generateEmbeddings, generateStructuredJson } from "../lib/ai";
import { chunkText } from "../lib/chunking";
import { internalApi } from "../lib/internal-api";
import { parseJsonResponse } from "../lib/json-repair";
import { collectTextDetectionText, getTextDetectionStatus, startTextDetection, type TextractError } from "../lib/textract";
import {
  ARTISTS_KEYS,
  PRIMARY_KEYS,
  SECONDARY_KEYS,
  artistsPrompt,
  primaryPrompt,
  secondaryPrompt,
} from "../prompts";

export type PipelineParams = {
  job_id: string;
  contract_id: string;
  workspace_id: string;
  /** EXTRACT_FULL | RETRY_PARTIAL | REANALYZE */
  mode: string;
  retry_options?: {
    extract_text?: boolean;
    generate_embeddings?: boolean;
    ai_analysis?: boolean;
    extract_thumbnail?: boolean;
  };
  /** FileAsset id of the contract PDF */
  asset_id?: string;
};

const AI_RETRIES: WorkflowStepConfig = { retries: { limit: 2, delay: "10 seconds", backoff: "exponential" } };

// Textract throttles under burst load (ProvisionedThroughputExceededException
// at ~5-20 async starts/second) — a deep exponential-backoff retry chain lets
// many concurrent pipelines self-space instead of failing.
const TEXTRACT_RETRIES: WorkflowStepConfig = {
  retries: { limit: 8, delay: "3 seconds", backoff: "exponential" },
  timeout: "2 minutes",
};

/** Maps AWS errors: throttling stays retryable, everything else aborts the step chain. */
const rethrowTextract = (error: unknown): never => {
  if ((error as TextractError).retryable) throw error;
  throw new NonRetryableError(error instanceof Error ? error.message : String(error));
};

export class ContractPipelineWorkflow extends WorkflowEntrypoint<Env, PipelineParams> {
  async run(event: WorkflowEvent<PipelineParams>, step: WorkflowStep) {
    const { job_id: jobId, contract_id: contractId, mode, retry_options: retryOptions } = event.payload;
    const api = internalApi(this.env);

    // Deterministic branch selection — depends only on the payload
    const isReanalysis = mode === "REANALYZE";
    const wants = (key: keyof NonNullable<PipelineParams["retry_options"]>) =>
      mode !== "RETRY_PARTIAL" || Boolean(retryOptions?.[key]);

    const report = (progress: number, stage: string, status?: string) =>
      api.reportProgress(jobId, { progress, current_stage: stage, status });

    try {
      await step.do("init", async () => {
        await report(5, "Inicializando", "RUNNING");
      });

      // ── Text ──────────────────────────────────────────────────────────
      let extractedText = await step.do("resolve existing text", async () => {
        const { extracted_text } = await api.getContractText(contractId);
        return extracted_text ?? "";
      });

      if ((!extractedText || wants("extract_text")) && !isReanalysis) {
        const extractionMode = (this.env.TEXT_EXTRACTION_MODE || "textract").toLowerCase();

        if (extractionMode === "textract") {
          // ── Textract straight from S3: no presigned URL, no download ──
          const location = await step.do("resolve asset location", async () => {
            const assetId = event.payload.asset_id;
            if (!assetId) throw new NonRetryableError("asset_id missing from payload");
            const { s3_key, s3_bucket } = await api.getPresignedUrl(assetId);
            if (!s3_key || !s3_bucket) throw new NonRetryableError("Asset S3 location unavailable");
            await report(15, "Iniciando extracción de texto (Textract)");
            return { key: s3_key, bucket: s3_bucket };
          });

          const textractJobId = await step.do("start textract job", TEXTRACT_RETRIES, async () => {
            try {
              return await startTextDetection(this.env, location.bucket, location.key);
            } catch (error) {
              return rethrowTextract(error);
            }
          });

          // Poll with step.sleep — idle time costs no CPU, so long documents
          // (Textract can take minutes) never hit Worker wall-time limits.
          let textractStatus = "IN_PROGRESS";
          for (let attempt = 0; attempt < 120 && textractStatus === "IN_PROGRESS"; attempt++) {
            await step.sleep(`textract wait ${attempt}`, attempt < 12 ? "5 seconds" : "15 seconds");
            textractStatus = await step.do(`textract status ${attempt}`, TEXTRACT_RETRIES, async () => {
              try {
                const { status } = await getTextDetectionStatus(this.env, textractJobId);
                return status;
              } catch (error) {
                return rethrowTextract(error);
              }
            });
          }
          if (textractStatus !== "SUCCEEDED" && textractStatus !== "PARTIAL_SUCCESS") {
            throw new NonRetryableError(`Textract job ended with status ${textractStatus}`);
          }

          extractedText = await step.do("collect textract text", TEXTRACT_RETRIES, async () => {
            try {
              const text = (await collectTextDetectionText(this.env, textractJobId)).trim();
              if (!text) throw new NonRetryableError("Textract returned no text for this document");
              await api.saveContractText(contractId, text);
              await report(35, "Texto extraído");
              return text;
            } catch (error) {
              if (error instanceof NonRetryableError) throw error;
              return rethrowTextract(error);
            }
          });
        } else {
          // ── Fallback: external extraction API (POST {url} -> {extracted_text}) ──
          extractedText = await step.do(
            "extract text",
            { retries: { limit: 3, delay: "30 seconds", backoff: "exponential" }, timeout: "10 minutes" },
            async () => {
              await report(20, "Extrayendo texto");
              const assetId = event.payload.asset_id;
              if (!assetId) throw new NonRetryableError("asset_id missing from payload");
              const { url } = await api.getPresignedUrl(assetId);
              if (!this.env.TEXT_EXTRACTOR_API_URL) {
                throw new NonRetryableError("TEXT_EXTRACTOR_API_URL is not configured");
              }
              const response = await fetch(this.env.TEXT_EXTRACTOR_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
              });
              if (!response.ok) {
                throw new Error(`Text extractor -> ${response.status}: ${(await response.text()).slice(0, 300)}`);
              }
              const data = await response.json<{ extracted_text?: string }>();
              const text = data.extracted_text?.trim();
              if (!text) throw new NonRetryableError("The extractor returned no text for this document");
              await api.saveContractText(contractId, text);
              await report(35, "Texto extraído");
              return text;
            }
          );
        }
      }

      if (!extractedText) {
        throw new NonRetryableError("The contract has no extracted text to analyze");
      }

      // ── Embeddings / vectorization ───────────────────────────────────
      if (wants("generate_embeddings") && !isReanalysis) {
        await step.do("generate embeddings", AI_RETRIES, async () => {
          await report(50, "Generando embeddings (vectorización)");
          const { exists } = await api.chunksExist(contractId);
          if (exists && mode !== "RETRY_PARTIAL") return { skipped: true };
          const chunks = chunkText(extractedText);
          // Embed in batches to stay under provider payload limits
          const embeddings: number[][] = [];
          for (let i = 0; i < chunks.length; i += 64) {
            const batch = chunks.slice(i, i + 64);
            embeddings.push(...(await generateEmbeddings(this.env, batch.map((c) => c.text))));
          }
          const records = chunks.map((chunk, i) => ({
            index: chunk.index,
            content: chunk.text,
            token_count: chunk.tokens,
            embedding: embeddings[i],
          }));
          // Persist in batches: a 1536-dim vector is ~30KB serialized, so a
          // full contract easily exceeds Django's request-body limit (→ 413).
          // First batch replaces the old chunk set, the rest append.
          const SAVE_BATCH = 40;
          for (let i = 0; i < records.length; i += SAVE_BATCH) {
            await api.saveChunks(contractId, records.slice(i, i + SAVE_BATCH), i === 0 ? "replace" : "append");
          }
          return { skipped: false, count: chunks.length };
        });
      }

      // ── AI analysis (3 parallel, independently-retriable subtasks) ───
      if (wants("ai_analysis") || isReanalysis) {
        await step.do("report analysis start", async () => {
          await report(60, "Analizando con IA");
        });

        const fileName = await step.do("resolve file name", async () => {
          const assetId = event.payload.asset_id;
          if (!assetId) return "contrato.pdf";
          const { name } = await api.getPresignedUrl(assetId);
          return name ?? "contrato.pdf";
        });

        const currentDateIso = await step.do("current date", async () => new Date().toISOString());

        // Each step parses inside the step (a retry regenerates malformed AI
        // output) but returns the validated JSON as a string — step return
        // values must be Serializable, which Record<string, unknown> is not.
        const analyzeStep = (name: string, prompt: string, keys: readonly string[], maxTokens: number) =>
          step.do(name, AI_RETRIES, async () => {
            const { text, model } = await generateStructuredJson(this.env, { prompt, keys, maxTokens });
            const parsed = parseJsonResponse<Record<string, unknown>>(text);
            return { data: JSON.stringify(parsed), model };
          });

        // Existing artist tags travel into the prompt so the AI maps name
        // variants (alias, casing, partial names) onto them instead of
        // creating near-duplicate tags for the same artist.
        const existingTags = await step.do("load existing tags", async () => {
          const { tags, detailed } = await api.getWorkspaceTags(event.payload.workspace_id);
          // Only artist-kind (and legacy unclassified) tags are relevant for
          // normalizing artist names; group/person tags would add noise.
          if (detailed) {
            return detailed
              .filter((tag) => tag.kind === "ARTIST" || tag.kind === "CUSTOM")
              .map((tag) => tag.name);
          }
          return tags;
        });

        const [primary, secondary, artists] = await Promise.all([
          analyzeStep("analyze primary", primaryPrompt(fileName, extractedText, currentDateIso), PRIMARY_KEYS, 4096),
          analyzeStep("analyze secondary", secondaryPrompt(fileName, extractedText), SECONDARY_KEYS, 2048),
          analyzeStep("analyze artists", artistsPrompt(extractedText, existingTags), ARTISTS_KEYS, 2048),
        ]);

        await step.do("save extracted data", async () => {
          await report(85, "Guardando información extraída");
          const merged = {
            ...JSON.parse(primary.data),
            ...JSON.parse(secondary.data),
            ...JSON.parse(artists.data),
          } as Record<string, unknown>;
          await api.saveExtractedData(contractId, merged, isReanalysis ? "proposed" : "apply", primary.model);
        });
      }

      // ── Thumbnail ─────────────────────────────────────────────────────
      if (wants("extract_thumbnail") && !isReanalysis) {
        await step.do("thumbnail placeholder", async () => {
          // Browser Rendering spike pending (see plan §3.2). Non-fatal: the
          // pipeline completes without a thumbnail and this step can be
          // retried selectively once the renderer lands.
          await report(92, "Miniatura pendiente de renderer");
          return { skipped: true };
        });
      }

      await step.do("finalize", async () => {
        await report(100, "Completado", "COMPLETED");
      });

      return { status: "completed", contract_id: contractId };
    } catch (error) {
      // Report the failure with its stage so the UI can show where it broke
      const message = error instanceof Error ? error.message : String(error);
      await step.do("report failure", async () => {
        await api.reportProgress(jobId, {
          status: "FAILED",
          error: { message: message.slice(0, 500), stage: "pipeline" },
        });
      });
      throw error;
    }
  }
}
