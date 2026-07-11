/**
 * Client for Plane's Django internal API (/api/internal/). The Worker never
 * touches Postgres directly — Django owns the schema; every read/write goes
 * through these endpoints, authenticated with the shared secret.
 */

export class InternalApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function internalApi(env: Env) {
  const base = env.PLANE_INTERNAL_API_URL.replace(/\/$/, "");

  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${base}/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Plane-Internal-Key": env.PLANE_INTERNAL_API_SECRET,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new InternalApiError(`Internal API ${method} ${path} -> ${response.status}: ${text.slice(0, 300)}`, response.status);
    }
    return response.json<T>();
  };

  return {
    getPresignedUrl: (assetId: string) =>
      request<{ url: string; name: string | null; type: string | null }>("GET", `/internal/assets/${assetId}/presigned-url/`),
    reportProgress: (
      jobId: string,
      data: { progress?: number; current_stage?: string; status?: string; error?: { message: string; stage: string } }
    ) => request<{ status: string }>("POST", `/internal/contract-jobs/${jobId}/progress/`, data),
    getContractText: (contractId: string) =>
      request<{ extracted_text: string | null; has_text: boolean }>("GET", `/internal/contracts/${contractId}/text/`),
    saveContractText: (contractId: string, extractedText: string) =>
      request<{ status: string }>("POST", `/internal/contracts/${contractId}/text/`, { extracted_text: extractedText }),
    saveExtractedData: (contractId: string, data: Record<string, unknown>, mode: "apply" | "proposed", modelUsed: string) =>
      request<{ status: string }>("POST", `/internal/contracts/${contractId}/extracted-data/`, {
        data,
        mode,
        model_used: modelUsed,
      }),
    chunksExist: (contractId: string) =>
      request<{ exists: boolean; count: number }>("GET", `/internal/contracts/${contractId}/chunks/`),
    saveChunks: (contractId: string, chunks: Array<{ index: number; content: string; token_count: number; embedding: number[] }>) =>
      request<{ status: string }>("POST", `/internal/contracts/${contractId}/chunks/`, { chunks }),
    createThumbnailUpload: (contractId: string) =>
      request<{ upload_data: { url: string; fields: Record<string, string> }; asset_id: string }>(
        "POST",
        `/internal/contracts/${contractId}/thumbnail/`
      ),
    confirmThumbnail: (contractId: string, assetId: string) =>
      request<{ status: string }>("PATCH", `/internal/contracts/${contractId}/thumbnail/`, { asset_id: assetId }),
    listContracts: (workspaceId: string, offset: number, limit: number) =>
      request<{
        total: number;
        offset: number;
        results: Array<{ id: string; titulo: string | null; file_name: string | null; extracted_text: string }>;
      }>("GET", `/internal/workspaces/${workspaceId}/contracts/?offset=${offset}&limit=${limit}`),
    saveQueryResult: (queryId: string, result: Record<string, unknown>, status: "COMPLETED" | "FAILED") =>
      request<{ status: string }>("POST", `/internal/contract-queries/${queryId}/result/`, { result, status }),
    searchChunks: (workspaceId: string, embedding: number[], limit: number) =>
      request<{
        results: Array<{
          content: string;
          chunk_index: number;
          similarity: number;
          contract_id: string;
          title: string | null;
          file_name: string | null;
          asset_id: string | null;
        }>;
      }>("POST", `/internal/workspaces/${workspaceId}/chunks/search/`, { embedding, limit }),
  };
}
