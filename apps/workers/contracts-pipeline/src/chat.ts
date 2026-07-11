/**
 * Synchronous chat turn. GENERAL mode: embeds the query, retrieves the
 * top-ranked chunks from Django's pgvector search, answers grounded on them
 * and reports which documents were used. CONTRACT mode: the contract's full
 * extracted text is the system context (no retrieval needed).
 */

import { ChatMessage, generateEmbeddings, generateText } from "./lib/ai";
import { internalApi } from "./lib/internal-api";

export type ChatRequest = {
  workspace_id: string;
  mode: "GENERAL" | "CONTRACT";
  query: string;
  history?: ChatMessage[];
  contract_id?: string | null;
  /** Model picked in the UI; must be one of the env-declared models */
  model?: string | null;
};

export type ChatSource = {
  contract_id: string;
  title: string | null;
  file_name: string | null;
  asset_id: string | null;
  similarity: number;
};

const RETRIEVAL_LIMIT = 12;
// Context budget: chunks are ~500 tokens each; 12 keeps us well inside limits
const CONTRACT_TEXT_LIMIT = 60_000;

const GENERAL_SYSTEM = (context: string) => `Eres un asistente experto en los contratos de este workspace.
Responde SIEMPRE en el idioma de la pregunta del usuario (por defecto español), de forma clara y concisa.
Usa EXCLUSIVAMENTE la información de los fragmentos de contratos siguientes; si la respuesta no está en ellos, dilo abiertamente.
Cuando cites datos, menciona de qué contrato provienen.

FRAGMENTOS DE CONTRATOS (recuperados por relevancia):
${context}`;

const CONTRACT_SYSTEM = (title: string, text: string) => `Eres un asistente experto en el contrato "${title}".
Responde SIEMPRE en el idioma de la pregunta del usuario (por defecto español), de forma clara y concisa.
Usa EXCLUSIVAMENTE el texto del contrato siguiente; si la respuesta no está en él, dilo abiertamente.

TEXTO COMPLETO DEL CONTRATO:
${text}`;

export async function handleChat(env: Env, body: ChatRequest): Promise<{ answer: string; sources: ChatSource[]; model: string }> {
  const api = internalApi(env);
  const history = (body.history ?? []).filter(
    (message) => message && (message.role === "user" || message.role === "assistant") && message.content
  );

  if (body.mode === "CONTRACT") {
    if (!body.contract_id) throw new Error("contract_id is required for CONTRACT mode");
    const { extracted_text } = await api.getContractText(body.contract_id);
    if (!extracted_text) throw new Error("The contract has no extracted text yet");
    const system = CONTRACT_SYSTEM(body.contract_id, extracted_text.slice(0, CONTRACT_TEXT_LIMIT));
    const { text, model } = await generateText(env, system, history, body.query, body.model ?? undefined);
    return { answer: text, sources: [], model };
  }

  // GENERAL: embed → rank (pgvector cosine) → ground the answer
  const [embedding] = await generateEmbeddings(env, [body.query]);
  const { results } = await api.searchChunks(body.workspace_id, embedding, RETRIEVAL_LIMIT);

  if (results.length === 0) {
    return {
      answer:
        "No hay contratos vectorizados en este workspace todavía. Categoriza un PDF como Contratos y espera a que termine el análisis para poder consultar su contenido.",
      sources: [],
      model: "none",
    };
  }

  const context = results
    .map(
      (chunk, index) =>
        `[${index + 1}] Contrato: ${chunk.title || chunk.file_name || chunk.contract_id} (fragmento ${chunk.chunk_index}, similitud ${chunk.similarity})\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  const { text, model } = await generateText(env, GENERAL_SYSTEM(context), history, body.query, body.model ?? undefined);

  // Sources: unique contracts ordered by their best-ranked chunk
  const sources: ChatSource[] = [];
  for (const chunk of results) {
    if (!sources.some((source) => source.contract_id === chunk.contract_id)) {
      sources.push({
        contract_id: chunk.contract_id,
        title: chunk.title,
        file_name: chunk.file_name,
        asset_id: chunk.asset_id,
        similarity: chunk.similarity,
      });
    }
  }

  return { answer: text, sources, model };
}
