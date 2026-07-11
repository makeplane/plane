/**
 * NL-query fan-out: pages every contract with extracted text, analyzes each
 * against the user's query (batched parallel steps), prunes false positives
 * with a synthesis pass and posts the result back — Django then emails it.
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent, WorkflowStepConfig } from "cloudflare:workers";

import { generateStructuredJson } from "../lib/ai";
import { internalApi } from "../lib/internal-api";
import { parseJsonResponse } from "../lib/json-repair";
import { QUERY_ANALYSIS_KEYS, SYNTHESIS_KEYS, queryAnalysisPrompt, synthesisPrompt } from "../prompts";

export type QueryParams = {
  job_id: string;
  query_id: string;
  workspace_id: string;
  user_query: string;
};

type ContractAnalysis = {
  contractId: string;
  title: string;
  coincide: boolean;
  confianza: number;
  razon: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaFinFinal: string | null;
  artistas: string[];
};

const PAGE_SIZE = 20;
const AI_RETRIES: WorkflowStepConfig = { retries: { limit: 2, delay: "10 seconds", backoff: "exponential" } };

export class ContractQueryWorkflow extends WorkflowEntrypoint<Env, QueryParams> {
  async run(event: WorkflowEvent<QueryParams>, step: WorkflowStep) {
    const { job_id: jobId, query_id: queryId, workspace_id: workspaceId, user_query: userQuery } = event.payload;
    const api = internalApi(this.env);

    try {
      const { currentDateIso, currentYear } = await step.do("init", async () => {
        await api.reportProgress(jobId, { progress: 5, current_stage: "Recopilando contratos", status: "RUNNING" });
        const now = new Date();
        return { currentDateIso: now.toISOString(), currentYear: now.getFullYear() };
      });

      // ── Fan-out per contract, one page at a time ─────────────────────
      const analyses: ContractAnalysis[] = [];
      let offset = 0;
      let total = Infinity;
      let pageNumber = 0;

      while (offset < total) {
        const page = await step.do(`list contracts page ${pageNumber}`, async () =>
          api.listContracts(workspaceId, offset, PAGE_SIZE)
        );
        total = page.total;

        const pageResults = await Promise.all(
          page.results.map((contract) =>
            step.do(`analyze contract ${contract.id}`, AI_RETRIES, async () => {
              const { text } = await generateStructuredJson(this.env, {
                prompt: queryAnalysisPrompt(
                  contract.titulo || contract.file_name || `Contrato ${contract.id}`,
                  contract.extracted_text,
                  userQuery,
                  currentDateIso,
                  currentYear
                ),
                keys: QUERY_ANALYSIS_KEYS,
                maxTokens: 2048,
              });
              const parsed = parseJsonResponse<Partial<ContractAnalysis>>(text);
              return {
                contractId: contract.id,
                title: contract.titulo || contract.file_name || `Contrato ${contract.id}`,
                coincide: Boolean(parsed.coincide),
                confianza: Number(parsed.confianza ?? 0),
                razon: String(parsed.razon ?? ""),
                fechaInicio: parsed.fechaInicio ?? null,
                fechaFin: parsed.fechaFin ?? null,
                fechaFinFinal: parsed.fechaFinFinal ?? null,
                artistas: Array.isArray(parsed.artistas) ? parsed.artistas.map(String) : [],
              } satisfies ContractAnalysis;
            })
          )
        );
        analyses.push(...pageResults);

        offset += PAGE_SIZE;
        pageNumber += 1;
        await step.do(`report progress page ${pageNumber}`, async () => {
          const done = Math.min(offset, total);
          const progress = total > 0 ? Math.min(90, 10 + Math.round((done / total) * 70)) : 90;
          await api.reportProgress(jobId, {
            progress,
            current_stage: `Analizando contratos (${done}/${total})`,
          });
        });
      }

      const candidates = analyses.filter((a) => a.coincide).sort((a, b) => b.confianza - a.confianza);

      // ── Synthesis: prune false positives, write the executive summary ─
      let summary = "";
      let selectedIds = new Set(candidates.map((c) => c.contractId));

      if (candidates.length > 0) {
        const synthesis = await step.do("synthesis", AI_RETRIES, async () => {
          await api.reportProgress(jobId, { progress: 92, current_stage: "Sintetizando resultados" });
          const { text } = await generateStructuredJson(this.env, {
            prompt: synthesisPrompt(userQuery, currentDateIso, currentYear, candidates),
            keys: SYNTHESIS_KEYS,
            maxTokens: 4096,
          });
          const parsed = parseJsonResponse<{ resumen?: string; contractIdsSeleccionados?: string[] }>(text);
          return {
            resumen: parsed.resumen ?? "",
            contractIds: Array.isArray(parsed.contractIdsSeleccionados)
              ? parsed.contractIdsSeleccionados.map(String)
              : [],
          };
        });
        summary = synthesis.resumen;
        if (synthesis.contractIds.length > 0) {
          const candidateIds = new Set(candidates.map((c) => c.contractId));
          selectedIds = new Set(synthesis.contractIds.filter((id) => candidateIds.has(id)));
        }
      } else {
        summary =
          "No se encontraron contratos que coincidan con la petición tras analizar el contenido de todos los documentos disponibles.";
      }

      const matches = candidates
        .filter((c) => selectedIds.has(c.contractId))
        .map((c) => ({
          contract_id: c.contractId,
          title: c.title,
          artists: c.artistas.length > 0 ? c.artistas.join(", ") : null,
          start_date: c.fechaInicio,
          end_date: c.fechaFin,
          final_end_date: c.fechaFinFinal,
          reason: c.razon,
        }));

      await step.do("save result", async () => {
        await api.saveQueryResult(queryId, { summary, matches, scanned_count: analyses.length }, "COMPLETED");
        await api.reportProgress(jobId, { progress: 100, current_stage: "Completado", status: "COMPLETED" });
      });

      return { matches: matches.length, scanned: analyses.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await step.do("report failure", async () => {
        await api.saveQueryResult(queryId, { summary: "", matches: [], scanned_count: 0 }, "FAILED");
        await api.reportProgress(jobId, {
          status: "FAILED",
          error: { message: message.slice(0, 500), stage: "query" },
        });
      });
      throw error;
    }
  }
}
