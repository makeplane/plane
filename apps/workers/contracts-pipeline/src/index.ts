/**
 * HTTP trigger surface for the contracts pipeline. Django (celery) calls
 * these endpoints with a shared secret; the Worker creates the corresponding
 * Workflow instance and returns its id. Narrow, single-purpose surface so
 * Django never needs a broad Cloudflare account token.
 */

import { ContractPipelineWorkflow, type PipelineParams } from "./workflows/contract-pipeline";
import { ContractQueryWorkflow, type QueryParams } from "./workflows/contract-query";

export { ContractPipelineWorkflow, ContractQueryWorkflow };

/** Constant-time secret comparison (hash first so length differences don't leak). */
async function verifySecret(provided: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const provided = request.headers.get("X-Trigger-Secret") ?? "";
    if (!(await verifySecret(provided, env.CF_WORKER_TRIGGER_SECRET))) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      if (url.pathname === "/trigger/extract") {
        const params = await request.json<PipelineParams>();
        if (!params.job_id || !params.contract_id || !params.workspace_id) {
          return Response.json({ error: "job_id, contract_id and workspace_id are required" }, { status: 400 });
        }
        const instance = await env.CONTRACT_PIPELINE.create({
          id: crypto.randomUUID(),
          params,
        });
        console.log(JSON.stringify({ message: "pipeline instance created", id: instance.id, job: params.job_id }));
        return Response.json({ workflow_instance_id: instance.id });
      }

      if (url.pathname === "/trigger/query") {
        const params = await request.json<QueryParams>();
        if (!params.job_id || !params.query_id || !params.workspace_id || !params.user_query) {
          return Response.json(
            { error: "job_id, query_id, workspace_id and user_query are required" },
            { status: 400 }
          );
        }
        const instance = await env.CONTRACT_QUERY.create({
          id: crypto.randomUUID(),
          params,
        });
        console.log(JSON.stringify({ message: "query instance created", id: instance.id, job: params.job_id }));
        return Response.json({ workflow_instance_id: instance.id });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(JSON.stringify({ message: "trigger failed", path: url.pathname, error: message }));
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
