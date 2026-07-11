// Placeholder so `tsc --noEmit` works before the first `wrangler types` run.
// Regenerate with `npx wrangler types` after any wrangler.jsonc binding change —
// never extend this by hand beyond keeping it in sync with the config.
interface Env {
  // Workflows
  CONTRACT_PIPELINE: Workflow;
  CONTRACT_QUERY: Workflow;
  // Secrets (wrangler secret put / .dev.vars)
  CF_WORKER_TRIGGER_SECRET: string;
  PLANE_INTERNAL_API_SECRET: string;
  OPENAI_API_KEY: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  DEEPSEEK_API_KEY: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  // Vars (wrangler.jsonc)
  AI_PROVIDER: string;
  GEMINI_MODEL_FALLBACK_LIST: string;
  DEEPSEEK_MODEL: string;
  DEEPSEEK_MODEL_LIST: string;
  CHAT_DEFAULT_MODEL: string;
  OPENAI_EMBEDDING_MODEL: string;
  EMBEDDING_DIMENSIONS: string;
  PLANE_INTERNAL_API_URL: string;
  TEXT_EXTRACTION_MODE: string;
  AWS_REGION: string;
  TEXT_EXTRACTOR_API_URL: string;
}
