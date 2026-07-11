/**
 * AI provider layer — raw fetch against the providers' REST endpoints (no
 * Node SDKs; the Workers runtime is a V8 isolate). Base provider and models
 * come from env vars, never hardcoded:
 *   AI_PROVIDER=gemini|deepseek        primary provider
 *   GEMINI_MODEL_FALLBACK_LIST=a,b,c   ordered fallback chain
 *   DEEPSEEK_MODEL=deepseek-chat
 *   OPENAI_EMBEDDING_MODEL / EMBEDDING_DIMENSIONS
 * With gemini as primary, every model in the chain is tried on retryable
 * errors (429/503/overloaded) and DeepSeek runs as the last resort.
 */

export type StructuredJsonRequest = {
  prompt: string;
  /** Top-level keys the caller expects — steers DeepSeek's JSON mode */
  keys: readonly string[];
  maxTokens?: number;
};

export type StructuredJsonResult = { text: string; model: string };

const isRetryableGeminiError = (status: number, body: string): boolean =>
  status === 429 || status === 503 || /UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED/i.test(body);

async function callGemini(env: Env, model: string, req: StructuredJsonRequest): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.prompt }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );
  const bodyText = await response.text();
  if (!response.ok) {
    const error = new Error(`Gemini ${model} -> ${response.status}: ${bodyText.slice(0, 300)}`);
    (error as Error & { retryable?: boolean }).retryable = isRetryableGeminiError(response.status, bodyText);
    throw error;
  }
  const data = JSON.parse(bodyText) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error(`Gemini ${model} returned an empty response`);
  return text;
}

async function callDeepseek(env: Env, req: StructuredJsonRequest): Promise<string> {
  // DeepSeek JSON mode: response_format json_object, single object only, and
  // the word "json" must appear in the prompt (https://api-docs.deepseek.com/guides/json_mode)
  const keysHint =
    req.keys.length > 0
      ? ` Responde con un único objeto json (no un array) con exactamente estas claves: ${req.keys.join(", ")}.`
      : " Responde con un único objeto json (no un array).";
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: keysHint.trim() },
        { role: "user", content: req.prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: req.maxTokens ?? 4096,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek -> ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const data = await response.json<{ choices?: Array<{ message?: { content?: string } }> }>();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("DeepSeek returned an empty response");
  return text;
}

/** Runs the configured provider chain and returns the raw JSON text + model used. */
export async function generateStructuredJson(env: Env, req: StructuredJsonRequest): Promise<StructuredJsonResult> {
  const provider = (env.AI_PROVIDER || "gemini").toLowerCase();

  if (provider === "deepseek") {
    return { text: await callDeepseek(env, req), model: env.DEEPSEEK_MODEL || "deepseek-chat" };
  }

  // gemini primary: walk the fallback chain, then DeepSeek as last resort
  const models = (env.GEMINI_MODEL_FALLBACK_LIST || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  if (models.length === 0) throw new Error("GEMINI_MODEL_FALLBACK_LIST is not configured");

  let lastError: unknown;
  for (const model of models) {
    try {
      return { text: await callGemini(env, model, req), model };
    } catch (error) {
      lastError = error;
      if (!(error as Error & { retryable?: boolean }).retryable) throw error;
      console.log(JSON.stringify({ message: "gemini model unavailable, trying next", model }));
    }
  }
  try {
    console.log(JSON.stringify({ message: "all gemini models unavailable, falling back to deepseek" }));
    return { text: await callDeepseek(env, req), model: `deepseek:${env.DEEPSEEK_MODEL || "deepseek-chat"}` };
  } catch (deepseekError) {
    console.error(JSON.stringify({ message: "deepseek fallback failed", error: String(deepseekError) }));
    throw lastError ?? deepseekError;
  }
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

async function callGeminiChat(
  env: Env,
  model: string,
  system: string,
  history: ChatMessage[],
  query: string
): Promise<string> {
  const contents = [
    ...history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    { role: "user", parts: [{ text: query }] },
  ];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_GENERATIVE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );
  const bodyText = await response.text();
  if (!response.ok) {
    const error = new Error(`Gemini ${model} -> ${response.status}: ${bodyText.slice(0, 300)}`);
    (error as Error & { retryable?: boolean }).retryable = isRetryableGeminiError(response.status, bodyText);
    throw error;
  }
  const data = JSON.parse(bodyText) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error(`Gemini ${model} returned an empty response`);
  return text;
}

async function callDeepseekChat(
  env: Env,
  model: string,
  system: string,
  history: ChatMessage[],
  query: string
): Promise<string> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...history, { role: "user", content: query }],
      max_tokens: 2048,
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek ${model} -> ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const data = await response.json<{ choices?: Array<{ message?: { content?: string } }> }>();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error(`DeepSeek ${model} returned an empty response`);
  return text;
}

export type ChatModelOption = { id: string; provider: "gemini" | "deepseek" };

const geminiModels = (env: Env): string[] =>
  (env.GEMINI_MODEL_FALLBACK_LIST || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

const deepseekModels = (env: Env): string[] => {
  const list = (env.DEEPSEEK_MODEL_LIST || env.DEEPSEEK_MODEL || "deepseek-chat")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return list;
};

/** Selectable chat models, entirely env-driven (never hardcoded in the UI). */
export function listChatModels(env: Env): { models: ChatModelOption[]; default_model: string } {
  const models: ChatModelOption[] = [
    ...deepseekModels(env).map((id) => ({ id, provider: "deepseek" as const })),
    ...geminiModels(env).map((id) => ({ id, provider: "gemini" as const })),
  ];
  const fallback = models[0]?.id ?? "deepseek-chat";
  const configuredDefault = env.CHAT_DEFAULT_MODEL?.trim();
  const default_model =
    configuredDefault && models.some((model) => model.id === configuredDefault) ? configuredDefault : fallback;
  return { models, default_model };
}

/**
 * Free-text chat turn. `preferredModel` (from the UI picker) runs first when
 * it is one of the env-declared models; on retryable failure the normal
 * provider chain takes over.
 */
export async function generateText(
  env: Env,
  system: string,
  history: ChatMessage[],
  query: string,
  preferredModel?: string
): Promise<{ text: string; model: string }> {
  const provider = (env.AI_PROVIDER || "gemini").toLowerCase();

  if (preferredModel) {
    const isDeepseek = deepseekModels(env).includes(preferredModel);
    const isGemini = geminiModels(env).includes(preferredModel);
    if (isDeepseek) {
      return { text: await callDeepseekChat(env, preferredModel, system, history, query), model: preferredModel };
    }
    if (isGemini) {
      try {
        return { text: await callGeminiChat(env, preferredModel, system, history, query), model: preferredModel };
      } catch (error) {
        if (!(error as Error & { retryable?: boolean }).retryable) throw error;
        console.log(JSON.stringify({ message: "preferred gemini model unavailable, falling back", preferredModel }));
      }
    }
    // Unknown model ids fall through to the configured chain
  }

  if (provider === "deepseek") {
    const model = deepseekModels(env)[0];
    return { text: await callDeepseekChat(env, model, system, history, query), model };
  }

  const models = geminiModels(env);
  if (models.length === 0) throw new Error("GEMINI_MODEL_FALLBACK_LIST is not configured");

  let lastError: unknown;
  for (const model of models) {
    try {
      return { text: await callGeminiChat(env, model, system, history, query), model };
    } catch (error) {
      lastError = error;
      if (!(error as Error & { retryable?: boolean }).retryable) throw error;
      console.log(JSON.stringify({ message: "gemini chat model unavailable, trying next", model }));
    }
  }
  try {
    const model = deepseekModels(env)[0];
    return { text: await callDeepseekChat(env, model, system, history, query), model: `deepseek:${model}` };
  } catch (deepseekError) {
    throw lastError ?? deepseekError;
  }
}

/** OpenAI embeddings (text-embedding-3-small @ 1536 dims by default). */
export async function generateEmbeddings(env: Env, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      input: texts,
      dimensions: parseInt(env.EMBEDDING_DIMENSIONS || "1536", 10),
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI embeddings -> ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const data = await response.json<{ data: Array<{ embedding: number[] }> }>();
  return data.data.map((item) => item.embedding);
}
